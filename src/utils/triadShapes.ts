import { Chord as TonalChord, Collection } from "tonal";
import type { StringSet } from "./stringSetTypes";

export type ShapeName = "D" | "A" | "E";
export type { StringSet };

export interface TriadShape {
  name: ShapeName;
  stringSet: StringSet;
  rootString: number; // 1–6 (1 = high E)
  // intervalMap: [lowest, middle, highest] → indices into chord.intervals
  intervalMap: [number, number, number];
  tuning: [string, string, string];
}

export interface FretPosition {
  string: number; // 1–6 (1 = high E)
  fret: number;
  interval: string;
}

const STRING_SET_TUNING: Record<StringSet, [string, string, string]> = {
  I: ["E4", "B3", "G3"], // strings 1,2,3
  II: ["B3", "G3", "D3"], // strings 2,3,4
  III: ["G3", "D3", "A2"], // strings 3,4,5
  IV: ["D3", "A2", "E2"], // strings 4,5,6
};

const SHAPES: TriadShape[] = [];

for (const [setId, tuning] of Object.entries(STRING_SET_TUNING) as [
  StringSet,
  [string, string, string],
][]) {
  const baseString =
    setId === "I" ? 1 : setId === "II" ? 2 : setId === "III" ? 3 : 4;

  SHAPES.push(
    // D shape: root on middle string
    {
      name: "D",
      stringSet: setId,
      rootString: baseString + 1,
      intervalMap: [2, 0, 1],
      tuning,
    },
    // A shape: root on lowest string
    {
      name: "A",
      stringSet: setId,
      rootString: baseString + 2,
      intervalMap: [0, 1, 2],
      tuning,
    },
    // E shape: root on highest string
    {
      name: "E",
      stringSet: setId,
      rootString: baseString,
      intervalMap: [1, 2, 0],
      tuning,
    },
  );
}

const TRIAD_TYPE_MAP: Record<"Major" | "Minor" | "Dim", string> = {
  Major: "",
  Minor: "m",
  Dim: "dim",
};

type ShapePattern = [number, number, number];

type ShapePatternsPerSet = Record<
  ShapeName,
  Record<"Major" | "Minor" | "Dim", ShapePattern>
>;

// Sets III & IV share the same patterns (both have 5-5 semitone intervals)
const PATTERNS_55: ShapePatternsPerSet = {
  E: { Major: [2, 0, 0], Minor: [1, 0, 0], Dim: [1, -1, 0] },
  D: { Major: [0, 0, -1], Minor: [0, 0, -2], Dim: [-1, 0, -2] },
  A: { Major: [0, -1, -3], Minor: [0, -2, -3], Dim: [0, -2, -4] },
};

const SHAPE_PATTERNS: Record<StringSet, ShapePatternsPerSet> = {
  // Set I: strings 1-2-3 (E-B-G), intervals 5-4
  I: {
    E: { Major: [1, 0, 0], Minor: [0, 0, 0], Dim: [0, -1, 0] },
    D: { Major: [-1, 0, -1], Minor: [-1, 0, -2], Dim: [-2, 0, -2] },
    A: { Major: [0, 0, -2], Minor: [0, -1, -2], Dim: [0, -1, -3] },
  },
  // Set II: strings 2-3-4 (B-G-D), intervals 4-5
  II: {
    E: { Major: [1, -1, 0], Minor: [0, -1, 0], Dim: [0, -2, 0] },
    D: { Major: [0, 0, 0], Minor: [0, 0, -1], Dim: [-1, 0, -1] },
    A: { Major: [0, -1, -2], Minor: [0, -2, -2], Dim: [0, -2, -3] },
  },
  // Set III: strings 3-4-5 (G-D-A), intervals 5-5
  III: PATTERNS_55,
  // Set IV: strings 4-5-6 (D-A-E), intervals 5-5
  IV: PATTERNS_55,
};

const OPEN_STRING_SEMITONE: Record<number, number> = {
  1: 4, // E
  2: 11, // B
  3: 7, // G
  4: 2, // D
  5: 9, // A
  6: 4, // E
};

function getFretForNote(noteName: string, stringNum: number): number {
  const noteMap: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };

  const base = noteName[0]!.toUpperCase();
  let semitone = noteMap[base] ?? 0;

  if (noteName.includes("#")) semitone += 1;
  if (noteName.includes("b")) semitone -= 1;

  const open = OPEN_STRING_SEMITONE[stringNum]!;
  return (((semitone - open) % 12) + 12) % 12;
}

export function calculateFretPositions(
  rootNote: string,
  quality: "Major" | "Minor" | "Dim",
  shape: ShapeName,
  stringSet: StringSet,
): FretPosition[] {
  const pattern = SHAPE_PATTERNS[stringSet][shape][quality];

  const shapeData = SHAPES.find(
    (s) => s.name === shape && s.stringSet === stringSet,
  )!;
  const rootString = shapeData.rootString;
  const rootFret = getFretForNote(rootNote, rootString);

  const baseString =
    stringSet === "I"
      ? 1
      : stringSet === "II"
        ? 2
        : stringSet === "III"
          ? 3
          : 4;

  const strings = [baseString + 2, baseString + 1, baseString]; // lowest → highest

  const positions: FretPosition[] = strings.map((str, i) => ({
    string: str,
    fret: rootFret + pattern[i]!,
    interval: "",
  }));

  if (positions.some((p) => p.fret < 0)) {
    for (const p of positions) p.fret += 12;
  }

  const chord = TonalChord.get(`${rootNote}${TRIAD_TYPE_MAP[quality]}`);
  const intervals = chord.intervals;

  positions.forEach((pos, i) => {
    pos.interval = intervals[shapeData.intervalMap[i]!]!;
  });

  return positions.sort((posA, posB) => posA.string - posB.string);
}

export function pickRandomShape(
  stringSet: StringSet,
  previousShape?: ShapeName,
): ShapeName {
  const setShapes = SHAPES.filter((s) => s.stringSet === stringSet);
  const candidates = previousShape
    ? setShapes.filter((s) => s.name !== previousShape)
    : setShapes;

  const shuffled = Collection.shuffle(candidates.map((s) => s.name));
  return shuffled[0]!;
}

export const SHAPE_NAMES: ShapeName[] = ["D", "A", "E"];

export function getTuningForStringSet(
  stringSet: StringSet,
): [string, string, string] {
  return STRING_SET_TUNING[stringSet];
}

export function getMutedStringsForSet(stringSet: StringSet): number[] {
  const baseString =
    stringSet === "I"
      ? 1
      : stringSet === "II"
        ? 2
        : stringSet === "III"
          ? 3
          : 4;

  const used = [baseString, baseString + 1, baseString + 2];
  return [1, 2, 3, 4, 5, 6].filter((s) => !used.includes(s));
}

export function pickRandomStringSet(selectedSets: StringSet[]): StringSet {
  if (selectedSets.length === 0) return "I";
  const shuffled = Collection.shuffle(selectedSets);
  return shuffled[0]!;
}
