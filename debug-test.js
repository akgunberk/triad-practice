import { calculateFretPositions } from './src/utils/triadShapes.ts'

// Manually test the logic
let positions = [
  { string: 1, fret: 3, interval: '5P' },
  { string: 2, fret: 1, interval: '1P' },
  { string: 3, fret: 9, interval: '3M' }
]

console.log('Initial:', positions.map(p => p.fret))

for (let iter = 0; iter < 5; iter++) {
  const minFret = Math.min(...positions.map(p => p.fret))
  const maxFret = Math.max(...positions.map(p => p.fret))
  
  console.log(`Iteration ${iter}: min=${minFret}, max=${maxFret}, span=${maxFret-minFret}`)
  
  if (maxFret - minFret <= 3) {
    console.log('SUCCESS - within 4 frets!')
    break
  }
  
  // Reduce any positions that are too far above the minimum
  for (const pos of positions) {
    if (pos.fret > minFret + 3) {
      console.log(`  Reducing fret ${pos.fret} to ${pos.fret - 12}`)
      pos.fret -= 12
    }
  }
  
  console.log('  After reduction:', positions.map(p => p.fret))
  
  // After reducing, if any went below 1, shift ALL up by 12
  if (positions.some(p => p.fret < 1)) {
    console.log('  Some < 1, shifting all up by 12')
    for (const p of positions) p.fret += 12
    console.log('  After shift:', positions.map(p => p.fret))
  }
}

console.log('Final:', positions.map(p => p.fret))
