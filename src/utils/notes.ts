import { Scale } from "tonal";

export interface Note {
  name: string;
  color: string;
}

const COLOR_PALETTE = [
  "#FF6B6B",
  "#FF8E53",
  "#FFC145",
  "#FFE66D",
  "#88D8B0",
  "#6BCB77",
  "#4ECDC4",
  "#45B7D1",
  "#7C83FD",
  "#B388FF",
  "#F78FB3",
  "#E056A0",
];

export const CHROMATIC_SCALE = Scale.get("c chromatic").notes;

export const NOTES: Note[] = CHROMATIC_SCALE.map((name, idx) => ({
  name,
  color: COLOR_PALETTE[idx]!,
}));

export type TriadType = "Major" | "Minor" | "Dim";

export const TRIAD_TYPES: TriadType[] = ["Major", "Minor", "Dim"];

export function getNoteColor(noteName: string): string {
  return NOTES.find((n) => n.name === noteName)?.color ?? "#ffffff";
}
