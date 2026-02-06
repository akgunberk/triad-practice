import { Chord as TonalChord, Collection } from 'tonal'
import type { StringSet } from './stringSetTypes'

export type ShapeName = 'D' | 'A' | 'E'
export type { StringSet }

export interface TriadShape {
  name: ShapeName
  stringSet: StringSet
  rootString: number // 1-6 on full 6-string guitar
  // Interval indices per string [highest, middle, lowest], referencing chord.intervals
  intervalMap: [number, number, number]
  tuning: [string, string, string] // The 3 strings used
}

export interface FretPosition {
  string: number // 1-6 (1=high E, 6=low E)
  fret: number
  interval: string // tonal IntervalName e.g. '1P', '3M', '3m', '5P', '5d'
}

// String set configurations: tuning for each 3-string set
const STRING_SET_TUNING: Record<StringSet, [string, string, string]> = {
  'I': ['E4', 'B3', 'G3'],   // Strings 1, 2, 3
  'II': ['B3', 'G3', 'D3'],  // Strings 2, 3, 4
  'III': ['G3', 'D3', 'A2'], // Strings 3, 4, 5
  'IV': ['D3', 'A2', 'E2'],  // Strings 4, 5, 6
}

// Generate shapes for all string sets
// intervalMap: which chord interval (0=root, 1=third, 2=fifth) goes on each string
const SHAPES: TriadShape[] = []
for (const [setId, tuning] of Object.entries(STRING_SET_TUNING) as [StringSet, [string, string, string]][]) {
  const baseString = setId === 'I' ? 1 : setId === 'II' ? 2 : setId === 'III' ? 3 : 4
  SHAPES.push(
    { name: 'D', stringSet: setId, rootString: baseString + 1, intervalMap: [2, 0, 1], tuning }, // middle=Root
    { name: 'A', stringSet: setId, rootString: baseString + 2, intervalMap: [0, 1, 2], tuning }, // lowest=Root
    { name: 'E', stringSet: setId, rootString: baseString, intervalMap: [1, 2, 0], tuning },     // highest=Root
  )
}

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

// Open string semitone values for all 6 strings (1=high E, 6=low E)
const OPEN_STRING_SEMITONE: Record<number, number> = {
  1: 4,  // E (high E4)
  2: 11, // B (B3)
  3: 7,  // G (G3)
  4: 2,  // D (D3)
  5: 9,  // A (A2)
  6: 4,  // E (low E2)
}

function fretForSemitoneOnString(semitoneOffset: number, rootSemitone: number, stringNum: number): number {
  const target = (rootSemitone + semitoneOffset) % 12
  const open = OPEN_STRING_SEMITONE[stringNum]!
  const fret = ((target - open) % 12 + 12) % 12
  return fret === 0 ? 12 : fret
}

/**
 * Calculate fret positions for a triad shape given root note, quality, and string set.
 * Uses tonal to derive intervals (e.g. 1P, 3M, 3m, 5P, 5d) from chord type.
 */
export function calculateFretPositions(
  rootNote: string,
  quality: 'Major' | 'Minor' | 'Dim',
  shape: ShapeName,
  stringSet: StringSet
): FretPosition[] {
  const tonalType = TRIAD_TYPE_MAP[quality]
  const chordData = TonalChord.get(`${rootNote} ${tonalType}`)
  const intervals = chordData.intervals // e.g. ['1P', '3M', '5P']

  const shapeData = SHAPES.find(s => s.name === shape && s.stringSet === stringSet)!
  const rootSemitone = chordData.tonic ? (({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 } as Record<string, number>)[chordData.tonic[0]!] ?? 0) + (chordData.tonic.includes('#') ? 1 : chordData.tonic.includes('b') ? -1 : 0) : 0

  // Map strings from highest to lowest pitch for this set
  const baseString = stringSet === 'I' ? 1 : stringSet === 'II' ? 2 : stringSet === 'III' ? 3 : 4
  const strings = [baseString, baseString + 1, baseString + 2] as const
  
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

export function pickRandomShape(stringSet: StringSet, previousShape?: ShapeName): ShapeName {
  const setShapes = SHAPES.filter(s => s.stringSet === stringSet)
  const candidates = previousShape
    ? setShapes.filter(s => s.name !== previousShape)
    : setShapes
  
  // Use Tonal Collection.shuffle for randomization
  const shuffled = Collection.shuffle(candidates.map(s => s.name))
  return shuffled[0]!
}

export const SHAPE_NAMES: ShapeName[] = ['D', 'A', 'E']

export function getTuningForStringSet(stringSet: StringSet): [string, string, string] {
  return STRING_SET_TUNING[stringSet]
}

export function getMutedStringsForSet(stringSet: StringSet): number[] {
  // Return strings that should be muted (strings not in the set)
  const baseString = stringSet === 'I' ? 1 : stringSet === 'II' ? 2 : stringSet === 'III' ? 3 : 4
  const usedStrings = [baseString, baseString + 1, baseString + 2]
  const allStrings = [1, 2, 3, 4, 5, 6]
  return allStrings.filter(s => !usedStrings.includes(s))
}

export function pickRandomStringSet(selectedSets: StringSet[]): StringSet {
  if (selectedSets.length === 0) return 'I'
  // Use Tonal Collection.shuffle for randomization
  const shuffled = Collection.shuffle(selectedSets)
  return shuffled[0]!
}
