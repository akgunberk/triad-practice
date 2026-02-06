import { Chord as TonalChord } from 'tonal'

export type ShapeName = 'D' | 'A' | 'E'

export interface TriadShape {
  name: ShapeName
  rootString: number // 1=E, 2=B, 3=G
  // Interval indices per string [str3, str2, str1], referencing chord.intervals
  intervalMap: [number, number, number]
}

export interface FretPosition {
  string: number
  fret: number
  interval: string // tonal IntervalName e.g. '1P', '3M', '3m', '5P', '5d'
}

// intervalMap: which chord interval (0=root, 1=third, 2=fifth) goes on each string
const SHAPES: TriadShape[] = [
  { name: 'D', rootString: 2, intervalMap: [2, 0, 1] }, // str3=5th, str2=Root, str1=3rd
  { name: 'A', rootString: 3, intervalMap: [0, 1, 2] }, // str3=Root, str2=3rd, str1=5th
  { name: 'E', rootString: 1, intervalMap: [1, 2, 0] }, // str3=3rd, str2=5th, str1=Root
]

const TRIAD_TYPE_MAP: Record<string, string> = {
  Major: 'major',
  Minor: 'minor',
  Dim: 'diminished',
}

// Semitone offsets for tonal intervals used in triads
const INTERVAL_SEMITONES: Record<string, number> = {
  '1P': 0,
  '3M': 4,
  '3m': 3,
  '5P': 7,
  '5d': 6,
}

// Open string semitone values (top 3 strings, as MIDI-style absolute)
const OPEN_STRING_SEMITONE: Record<number, number> = {
  3: 7,  // G
  2: 11, // B
  1: 4,  // E (high)
}

function fretForSemitoneOnString(semitoneOffset: number, rootSemitone: number, stringNum: number): number {
  const target = (rootSemitone + semitoneOffset) % 12
  const open = OPEN_STRING_SEMITONE[stringNum]!
  const fret = ((target - open) % 12 + 12) % 12
  return fret === 0 ? 12 : fret
}

/**
 * Calculate fret positions for a triad shape given root note and quality.
 * Uses tonal to derive intervals (e.g. 1P, 3M, 3m, 5P, 5d) from chord type.
 */
export function calculateFretPositions(
  rootNote: string,
  quality: 'Major' | 'Minor' | 'Dim',
  shape: ShapeName
): FretPosition[] {
  const tonalType = TRIAD_TYPE_MAP[quality]
  const chordData = TonalChord.get(`${rootNote} ${tonalType}`)
  const intervals = chordData.intervals // e.g. ['1P', '3M', '5P']

  const shapeData = SHAPES.find(s => s.name === shape)!
  const rootSemitone = chordData.tonic ? (({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 } as Record<string, number>)[chordData.tonic[0]!] ?? 0) + (chordData.tonic.includes('#') ? 1 : chordData.tonic.includes('b') ? -1 : 0) : 0

  const strings = [3, 2, 1] as const
  const positions: FretPosition[] = strings.map((str, i) => {
    const intervalIdx = shapeData.intervalMap[i]!
    const intervalName = intervals[intervalIdx]!
    const semitoneOffset = INTERVAL_SEMITONES[intervalName] ?? 0
    const fret = fretForSemitoneOnString(semitoneOffset, rootSemitone, str)
    return { string: str, fret, interval: intervalName }
  })

  // Ensure all frets are close together (within one octave position)
  const rootFret = positions.find(p => p.interval === '1P')!.fret
  for (const pos of positions) {
    while (pos.fret > rootFret + 4) pos.fret -= 12
    while (pos.fret < rootFret - 4) pos.fret += 12
  }

  // If any fret < 1, shift all up by 12
  if (positions.some(p => p.fret < 1)) {
    for (const p of positions) p.fret += 12
  }

  return positions
}

export function pickRandomShape(previousShape?: ShapeName): ShapeName {
  const candidates = previousShape
    ? SHAPES.filter(s => s.name !== previousShape)
    : SHAPES
  return candidates[Math.floor(Math.random() * candidates.length)]!.name
}

export const SHAPE_NAMES: ShapeName[] = ['D', 'A', 'E']
