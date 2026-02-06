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

// Shape patterns: fret offsets [string1, string2, string3] relative to root position
// For Set I (strings 1,2,3): E shape root on string 1, D shape root on string 2, A shape root on string 3
type ShapePattern = [number, number, number]

const SHAPE_PATTERNS: Record<ShapeName, Record<'Major' | 'Minor' | 'Dim', ShapePattern>> = {
  E: {
    Major: [1, 0, 0],   // E shape: root on string 1
    Minor: [1, -1, 0],  // 3rd down 1 semitone
    Dim: [0, -1, 0],    // 3rd down 1, 5th down 1
  },
  A: {
    Major: [2, 2, 0],   // A shape: root on string 3
    Minor: [1, 2, 0],   // 3rd down 1 semitone
    Dim: [1, 1, 0],     // 3rd down 1, 5th down 1
  },
  D: {
    Major: [-1, 0, -1], // D shape: root on string 2
    Minor: [-1, 0, 0],  // 3rd up 1 semitone
    Dim: [-2, 0, 0],    // 3rd up 1, 5th down 1
  },
}

// Which string has the root for each shape (for Set I)
const SHAPE_ROOT_STRING: Record<ShapeName, number> = {
  E: 1, // Root on E string
  D: 2, // Root on B string
  A: 3, // Root on G string
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

// Calculate which fret on a given string produces a specific note
function getFretForNote(noteName: string, stringNum: number): number {
  const noteMap: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
  const baseNote = noteName[0]!.toUpperCase()
  let semitone = noteMap[baseNote] ?? 0
  
  if (noteName.includes('#')) semitone += 1
  if (noteName.includes('b')) semitone -= 1
  
  const openStringSemitone = OPEN_STRING_SEMITONE[stringNum]!
  let fret = ((semitone - openStringSemitone) % 12 + 12) % 12
  
  // Prefer lower frets when possible
  if (fret === 0) fret = 12
  
  return fret
}

/**
 * Calculate fret positions for a triad shape using pattern-based approach.
 * Shapes are pre-defined patterns that guarantee 4-fret span.
 */
export function calculateFretPositions(
  rootNote: string,
  quality: 'Major' | 'Minor' | 'Dim',
  shape: ShapeName,
  stringSet: StringSet
): FretPosition[] {
  // Get the pattern for this shape and quality
  const pattern = SHAPE_PATTERNS[shape][quality]
  
  // Determine which string has the root based on shape and string set
  const baseString = stringSet === 'I' ? 1 : stringSet === 'II' ? 2 : stringSet === 'III' ? 3 : 4
  const rootStringOffset = SHAPE_ROOT_STRING[shape] - 1 // 0, 1, or 2
  const rootString = baseString + rootStringOffset
  
  // Find the root note's fret on the root string
  const rootFret = getFretForNote(rootNote, rootString)
  
  // Apply pattern offsets to get all three positions
  const strings = [baseString, baseString + 1, baseString + 2]
  const positions: FretPosition[] = strings.map((str, i) => ({
    string: str,
    fret: rootFret + pattern[i]!,
    interval: '' // We'll fill this in next
  }))
  
  // If any fret is < 1, shift all positions up by 12 (one octave)
  if (positions.some(p => p.fret < 1)) {
    for (const p of positions) {
      p.fret += 12
    }
  }
  
  // Assign intervals based on shape and quality using Tonal
  const tonalType = TRIAD_TYPE_MAP[quality]
  const chordData = TonalChord.get(`${rootNote} ${tonalType}`)
  const intervals = chordData.intervals // e.g. ['1P', '3M', '5P']
  
  const shapeData = SHAPES.find(s => s.name === shape && s.stringSet === stringSet)!
  positions.forEach((pos, i) => {
    const intervalIdx = shapeData.intervalMap[i]!
    pos.interval = intervals[intervalIdx]!
  })

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
