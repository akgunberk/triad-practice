import { type TriadType, TRIAD_TYPES } from './notes'
import { Chord as TonalChord, Note, Progression } from 'tonal'

export type ProgressionMode = "random" | "I-IV-V" | "II-V-I";

export interface Chord {
  root: string
  type: TriadType
  fullName?: string // For progression mode: stores the full chord name like "CMaj7"
}

export interface ProgressionState {
  mode: ProgressionMode
  key: string
  currentIndex: number
}

const TRIAD_TYPE_MAP: Record<TriadType, string> = {
  Major: 'major',
  Minor: 'minor',
  Dim: 'diminished',
}

const PROGRESSION_ROMAN_NUMERALS: Record<Exclude<ProgressionMode, "random">, string[]> = {
  "I-IV-V": ["IMaj7", "IVMaj7", "V7"],
  "II-V-I": ["IIm7", "V7", "IMaj7"],
}

export function getProgressionChord(
  progressionState: ProgressionState
): Chord {
  const { mode, key, currentIndex } = progressionState;
  
  if (mode === "random") {
    throw new Error("Use generateRandomChord for random mode");
  }

  const romanNumerals = PROGRESSION_ROMAN_NUMERALS[mode];
  const chords = Progression.fromRomanNumerals(key, romanNumerals);
  
  const chordName = chords[currentIndex % chords.length]!;
  
  // Parse chord to get root and type
  const chordData = TonalChord.get(chordName);
  const root = Note.simplify(chordData.tonic || key);
  
  // Determine triad type from chord quality
  let type: TriadType;
  const quality = chordData.quality.toLowerCase();
  if (quality.includes('minor') || quality === 'm') {
    type = 'Minor';
  } else if (quality.includes('dim')) {
    type = 'Dim';
  } else {
    type = 'Major';
  }
  
  return { root, type, fullName: chordName };
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
  // If fullName is provided (progression mode), use it directly
  if (chord.fullName) {
    const chordData = TonalChord.get(chord.fullName);
    return chordData.notes.map((n) => {
      const simplified = Note.simplify(n);
      return `${simplified}${octave}`;
    });
  }
  
  // Otherwise use the triad type
  const tonalType = TRIAD_TYPE_MAP[chord.type];
  const chordData = TonalChord.get(`${chord.root} ${tonalType}`);
  return chordData.notes.map((n) => {
    const simplified = Note.simplify(n);
    return `${simplified}${octave}`;
  });
}

export function formatChord(chord: Chord): string {
  // If fullName is provided (progression mode), use it
  if (chord.fullName) {
    return chord.fullName;
  }
  return `${chord.root} ${chord.type}`;
}
