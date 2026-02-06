import { calculateFretPositions } from './src/utils/triadShapes.ts'

const tests = [
  ['C', 'Major', 'D', 'I'],
  ['C', 'Minor', 'D', 'I'],
  ['C', 'Dim', 'D', 'I'],
  ['F#', 'Major', 'A', 'II'],
  ['Bb', 'Minor', 'E', 'III'],
  ['G', 'Dim', 'D', 'IV'],
]

console.log('=== SPOT CHECK TESTS ===\n')

for (const [note, quality, shape, set] of tests) {
  const positions = calculateFretPositions(note, quality, shape, set)
  const frets = positions.map(p => p.fret)
  const span = Math.max(...frets) - Math.min(...frets)
  const status = span <= 3 ? '✅' : '❌'
  console.log(`${status} ${note} ${quality} - Shape ${shape} - Set ${set}`)
  console.log(`   Frets: ${frets.join(', ')} (span: ${span})`)
  console.log(`   Intervals: ${positions.map(p => p.interval).join(', ')}\n`)
}
