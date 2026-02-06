import { calculateFretPositions } from './src/utils/triadShapes.ts'

const positions = calculateFretPositions('C', 'Major', 'D', 'I')
console.log('C Major, Shape D, Set I:')
console.log('Positions:', positions.map(p => `String ${p.string}: Fret ${p.fret} (${p.interval})`).join(', '))
const frets = positions.map(p => p.fret)
const minFret = Math.min(...frets)
const maxFret = Math.max(...frets)
const span = maxFret - minFret
console.log(`Frets: ${frets.join(', ')}`)
console.log(`Min: ${minFret}, Max: ${maxFret}, Span: ${span}`)
console.log(span <= 3 ? '✅ PASS' : '❌ FAIL')
