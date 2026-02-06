The feature to be added are listed below with details.
Use them as your plan.
Divide them into small chunks/phases if you need.

Use git worktrees to implement all of them in background.
i.e

- for feature 1: git worktree add ../<feature-name> -b <feature-name>
- for feature 2: git worktree add ../<feature-name> -b <feature-name>
  1. at the end when it's all done, merge them into 'main'
  2. solve conflicts if there is
  3. remove all feature folders and run `git worktree prune`

# Features

## Triad Shape Cheatsheet

1. Displaying selected triad shapes all the time in the right side of the screen.
   1. User sets the chord qualities to practice, let's say "major" and "minor".
   2. Display chord shape with no fretboard number just as a shape. Display what shape are those, D,E,A.
   3. User will understand if the next chord is minor, so it will remember quickly what shape to use.
   4. User spots the root note, and ta dah, plays the chord using memorized shape.

## Triads in different 3strings set

2.  Right now, only top 3 strings are used.
    Our goal is to teach padavans to learn all triad shapes,
    in all sets, such as EBG(Set I), BGD(Set II), GDA (Set III) and DAE (Set IV)
    1. Let people select, which sets s/he wants to practice, label them as I stated above.
    2. Change fretboardjs notation, always display 6 strings but use muteStrings function for not played strings.

    ```typescript
    // i.e for set I
    fretboard.muteStrings({ strings: [6, 5, 4] });
    ```

    3. Use tonal shuffle method to randomize notes.

    ```typescript
    import { Collection } from "tonal";
    Collection.shuffle(["a", "b", "c"]);`
    ```

## Circle Of Fiths and Fourths Mode

1. Practicers want to sound good and feel good after all, don't they?
   So we should give them to practice in a more broad way rather than random chords.
   First thing popped into my head is **Circle of Fifths and Fourths**
   1. Let user choose, **Circle Of Fifths** and its direction **right** or **left**
   2. Disabled note selection if this option chosen.
   3. Use tonal to get the circle of fifths array here is an example:

   ```typescript
   import { Note, Chord } from "@tonaljs/tonal";

   export function getCircleOfFifthsChordsFromCFlat(): string[] {
     const startNote = "C";
     const steps = 12;
     const interval = "5P"; // perfect fifth

     const notes: string[] = [startNote];

     for (let i = 1; i < steps; i++) {
       const prev = notes[i - 1];
       const next = Note.transpose(prev, interval);
       notes.push(next);
     }

     return notes.map((note) => {
       const flatNote = Note.enharmonic(note) ?? note;
       return Chord.get(`${flatNote}maj`).symbol;
     });
   }
   ```

## Progression mode

1. Add I-IV-V and II-V-I progression to practice
   1. Use select "Practice Progression mode"
   2. Disable note selection in this case
   3. Select either `I-IV-V` or `II-V-I` progression
   4. Use tonal Progression such as

   ```typescript
   import { Progression } from "tonal";

   Progression.fromRomanNumerals("C", ["IMaj7", "IIm7", "V7"]); // => ["CMaj7", "Dm7", "G7"]
   ```
