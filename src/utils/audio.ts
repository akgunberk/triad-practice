// Soundfont-based audio with AnalyserNode for visualizer FFT

import { Soundfont, getSoundfontNames } from 'smplr'

let audioCtx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let dataArray: Uint8Array | null = null
let soundfont: Soundfont | null = null
let isLoaded = false
let currentInstrumentName = 'string_ensemble_1'

function ensureAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.8
    analyser.connect(audioCtx.destination)
    dataArray = new Uint8Array(analyser.frequencyBinCount)
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
  // Route soundfont output through our analyser
  soundfont.output.addInsert(analyser!)
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
  if (!soundfont || !isLoaded) return
  ensureAudioContext()

  // Stop any currently ringing notes first
  soundfont.stop()

  // Play each note of the chord
  for (const note of noteNames) {
    soundfont.start({ note, velocity: 90 })
  }
}

export function stopChordSound() {
  if (!soundfont) return
  soundfont.stop()
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
