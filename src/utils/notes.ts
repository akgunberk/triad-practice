export interface Note {
  name: string
  color: string
}

export const NOTES: Note[] = [
  { name: 'C', color: '#FF6B6B' },
  { name: 'C#', color: '#FF8E53' },
  { name: 'D', color: '#FFC145' },
  { name: 'D#', color: '#FFE66D' },
  { name: 'E', color: '#88D8B0' },
  { name: 'F', color: '#6BCB77' },
  { name: 'F#', color: '#4ECDC4' },
  { name: 'G', color: '#45B7D1' },
  { name: 'G#', color: '#7C83FD' },
  { name: 'A', color: '#B388FF' },
  { name: 'A#', color: '#F78FB3' },
  { name: 'B', color: '#E056A0' },
]

export type TriadType = 'Major' | 'Minor' | 'Dim'

export const TRIAD_TYPES: TriadType[] = ['Major', 'Minor', 'Dim']

export function getNoteColor(noteName: string): string {
  return NOTES.find((n) => n.name === noteName)?.color ?? '#ffffff'
}
