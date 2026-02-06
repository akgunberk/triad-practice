import { type TriadType, TRIAD_TYPES } from './notes'
import { Chord as TonalChord, Note } from 'tonal'

export interface Chord {
  root: string
  type: TriadType
}

const TRIAD_TYPE_MAP: Record<TriadType, string> = {
  Major: 'major',
  Minor: 'minor',
  Dim: 'diminished',
}

export function generateRandomChord(selectedNotes: string[], previousChord?: Chord, selectedTypes?: TriadType[]): Chord {
  if (selectedNotes.length === 0) {
    throw new Error('No notes selected')
  }

  const types = selectedTypes && selectedTypes.length > 0 ? selectedTypes : TRIAD_TYPES

  let root: string
  if (selectedNotes.length === 1) {
    root = selectedNotes[0]!
  } else {
    // Avoid repeating the same root note consecutively
    const candidates = previousChord
      ? selectedNotes.filter((n) => n !== previousChord.root)
      : selectedNotes
    root = candidates[Math.floor(Math.random() * candidates.length)]!
  }

  const type = types[Math.floor(Math.random() * types.length)]!

  return { root, type }
}

export function getChordNoteNames(chord: Chord, octave = 4): string[] {
  const tonalType = TRIAD_TYPE_MAP[chord.type]
  const chordData = TonalChord.get(`${chord.root} ${tonalType}`)
  return chordData.notes.map((n) => {
    const simplified = Note.simplify(n)
    return `${simplified}${octave}`
  })
}

export function formatChord(chord: Chord): string {
  return `${chord.root} ${chord.type}`
}
