// Test manually what should happen for 1, 3, 9
const octaveShifts = [-12, 0, 12, 24]

let bestSpan = 99
let bestFrets = []

for (const s0 of octaveShifts) {
  for (const s1 of octaveShifts) {
    for (const s2 of octaveShifts) {
      const frets = [3 + s0, 1 + s1, 9 + s2]
      
      if (frets.some(f => f < 1)) continue
      
      const span = Math.max(...frets) - Math.min(...frets)
      
      if (span <= 3 && span < bestSpan) {
        bestSpan = span
        bestFrets = frets
        console.log(`Found better: shifts=[${s0},${s1},${s2}], frets=${frets}, span=${span}`)
      }
    }
  }
}

console.log(`\nBest: ${bestFrets}, span=${bestSpan}`)
