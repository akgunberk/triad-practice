import { Note } from 'tonal'
import type { TriadType } from './notes'
import type { Chord as ChordType } from './chordGenerator'

export type CircleDirection = 'right' | 'left'

export function getCircleOfFifthsProgression(
  direction: CircleDirection,
  selectedTypes: TriadType[]
): ChordType[] {
  const startNote = 'C'
  const steps = 12
  const interval = direction === 'right' ? '5P' : '4P' // perfect fifth or perfect fourth

  const notes: string[] = [startNote]

  for (let i = 1; i < steps; i++) {
    const prev = notes[i - 1]!
    const next = Note.transpose(prev, interval)
    notes.push(next)
  }

  // Convert notes to chord roots using enharmonic equivalents for flats
  const roots = notes.map((note) => {
    return Note.enharmonic(note) ?? note
  })

  // Create chord progression
  const progression: ChordType[] = []
  
  for (const root of roots) {
    // For each root, create chords for all selected types
    for (const type of selectedTypes) {
      progression.push({ root, type })
    }
  }

  return progression
}

export function getNextChordInCircle(
  currentChord: ChordType | undefined,
  progression: ChordType[]
): ChordType {
  if (!currentChord || progression.length === 0) {
    return progression[0]!
  }

  // Find current chord in progression
  const currentIndex = progression.findIndex(
    (chord) => chord.root === currentChord.root && chord.type === currentChord.type
  )

  if (currentIndex === -1) {
    // If current chord not in progression, start from beginning
    return progression[0]!
  }

  // Get next chord in progression (loop back to start if at end)
  const nextIndex = (currentIndex + 1) % progression.length
  return progression[nextIndex]!
}
