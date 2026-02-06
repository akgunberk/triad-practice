// Soundfont-based audio with AnalyserNode for visualizer FFT

import { Soundfont, getSoundfontNames } from 'smplr'

let audioCtx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let dataArray: Uint8Array | null = null
let soundfont: Soundfont | null = null
let isLoaded = false
let currentInstrumentName = 'string_ensemble_1'

let chordGainNode: GainNode | null = null
let chordFadeTimeout: ReturnType<typeof setTimeout> | null = null

function ensureAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.8
    analyser.connect(audioCtx.destination)
    dataArray = new Uint8Array(analyser.frequencyBinCount)
    
    // Create gain node for chord fading
    chordGainNode = audioCtx.createGain()
    chordGainNode.connect(analyser)
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

export async function initInstrument(instrumentName?: string): Promise<void> {
  const ctx = ensureAudioContext()
  const name = instrumentName ?? currentInstrumentName

  // Dispose previous soundfont
  if (soundfont) {
    soundfont.stop()
    soundfont.disconnect()
  }

  isLoaded = false
  currentInstrumentName = name

  soundfont = new Soundfont(ctx, { instrument: name as any })
  // Route soundfont output through our chord gain node (which routes to analyser)
  soundfont.output.addInsert(chordGainNode!)
  await soundfont.loaded()
  isLoaded = true
}

export function getIsLoaded(): boolean {
  return isLoaded
}

export function getInstrumentName(): string {
  return currentInstrumentName
}

export { getSoundfontNames }

export function playChordSound(noteNames: string[]) {
  if (!soundfont || !isLoaded || !chordGainNode) return
  const ctx = ensureAudioContext()

  // Cancel any pending fade timeout
  if (chordFadeTimeout) clearTimeout(chordFadeTimeout)

  // Stop any currently ringing notes first
  soundfont.stop()

  // Reset gain to full volume for new chord
  chordGainNode.gain.cancelScheduledValues(ctx.currentTime)
  chordGainNode.gain.setValueAtTime(1, ctx.currentTime)

  // Play each note of the chord
  for (const note of noteNames) {
    soundfont.start({ note, velocity: 90 })
  }
}

export function stopChordSound() {
  if (!soundfont) return
  soundfont.stop()
}

export function fadeOutChord(durationMs: number): void {
  if (!chordGainNode || !audioCtx) return

  // Cancel any pending fade timeout
  if (chordFadeTimeout) clearTimeout(chordFadeTimeout)

  const ctx = audioCtx
  const currentTime = ctx.currentTime
  const fadeDurationSec = durationMs / 1000

  // Exponential ramp to 0 over the specified duration
  chordGainNode.gain.setValueAtTime(chordGainNode.gain.value, currentTime)
  chordGainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + fadeDurationSec)

  // Stop the soundfont after fade completes
  chordFadeTimeout = setTimeout(() => {
    if (soundfont) soundfont.stop()
  }, durationMs)
}

export interface FrequencyData {
  lowerMaxFr: number
  lowerAvgFr: number
  upperMaxFr: number
  upperAvgFr: number
  overallAvg: number
}

export function getFrequencyData(): FrequencyData {
  if (!analyser || !dataArray) {
    return { lowerMaxFr: 0, lowerAvgFr: 0, upperMaxFr: 0, upperAvgFr: 0, overallAvg: 0 }
  }

  analyser.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>)

  const half = Math.floor(dataArray.length / 2)

  const avg = (start: number, end: number) => {
    let sum = 0
    for (let i = start; i < end; i++) sum += dataArray![i]!
    const len = end - start
    return len > 0 ? sum / len : 0
  }
  const max = (start: number, end: number) => {
    let m = 0
    for (let i = start; i < end; i++) if (dataArray![i]! > m) m = dataArray![i]!
    return m
  }

  const lowerLen = half || 1
  const upperLen = (dataArray.length - half) || 1

  return {
    lowerMaxFr: max(0, half) / lowerLen,
    lowerAvgFr: avg(0, half) / lowerLen,
    upperMaxFr: max(half, dataArray.length) / upperLen,
    upperAvgFr: avg(half, dataArray.length) / upperLen,
    overallAvg: avg(0, dataArray.length),
  }
}

export function playMetronomeClick(isBeat1: boolean): void {
  const ctx = ensureAudioContext()
  
  // Create oscillator and gain for the click
  const osc = ctx.createOscillator()
  const clickGain = ctx.createGain()
  
  // Higher pitch for beat 1, lower for other beats
  osc.frequency.value = isBeat1 ? 800 : 600
  osc.type = 'sine'
  
  // Connect to analyser so visualizer reacts
  clickGain.connect(analyser!)
  osc.connect(clickGain)
  
  // Duration: 100ms for beat 1, 80ms for others
  const durationMs = isBeat1 ? 100 : 80
  const durationSec = durationMs / 1000
  
  // Envelope: quick attack, exponential decay
  const now = ctx.currentTime
  clickGain.gain.setValueAtTime(0.3, now)
  clickGain.gain.exponentialRampToValueAtTime(0.01, now + durationSec)
  
  osc.start(now)
  osc.stop(now + durationSec)
}
