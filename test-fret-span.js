// Quick test to verify all shapes stay within 4-fret span
import { calculateFretPositions, SHAPE_NAMES } from './src/utils/triadShapes.ts'

const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const qualities = ['Major', 'Minor', 'Dim']
const shapes = SHAPE_NAMES
const stringSets = ['I', 'II', 'III', 'IV']

let maxSpanFound = 0
let violations = []

for (const note of notes) {
  for (const quality of qualities) {
    for (const shape of shapes) {
      for (const stringSet of stringSets) {
        try {
          const positions = calculateFretPositions(note, quality, shape, stringSet)
          const frets = positions.map(p => p.fret)
          const minFret = Math.min(...frets)
          const maxFret = Math.max(...frets)
          const span = maxFret - minFret
          
          if (span > maxSpanFound) {
            maxSpanFound = span
          }
          
          if (span > 3) {
            violations.push({
              note,
              quality,
              shape,
              stringSet,
              span,
              frets,
              minFret,
              maxFret
            })
          }
        } catch (e) {
          console.error(`Error with ${note} ${quality} ${shape} ${stringSet}:`, e.message)
        }
      }
    }
  }
}

console.log('\n=== FRET SPAN TEST RESULTS ===\n')
console.log(`Maximum span found: ${maxSpanFound} frets`)
console.log(`Total combinations tested: ${notes.length * qualities.length * shapes.length * stringSets.length}`)

if (violations.length === 0) {
  console.log('\n✅ SUCCESS! All shapes fit within 4-fret span (max span = 3)\n')
} else {
  console.log(`\n❌ VIOLATIONS FOUND: ${violations.length} shapes exceed 4-fret span:\n`)
  violations.forEach(v => {
    console.log(`  ${v.note} ${v.quality} - Shape ${v.shape} - Set ${v.stringSet}`)
    console.log(`    Frets: ${v.frets.join(', ')} (span: ${v.span}, min: ${v.minFret}, max: ${v.maxFret})`)
  })
  console.log()
}
