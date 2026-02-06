<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { Fretboard } from '@moonwave99/fretboard.js'
import type { Chord } from '../utils/chordGenerator'
import {
  calculateFretPositions,
  type ShapeName,
  type FretPosition,
  type StringSet,
  getMutedStringsForSet,
} from '../utils/triadShapes'

const props = defineProps<{
  chord: Chord | null
  shape: ShapeName | null
  stringSet: StringSet
}>()

const containerRef = ref<HTMLElement | null>(null)
let fretboard: InstanceType<typeof Fretboard> | null = null

// Map tonal interval names to display labels and colors
const INTERVAL_DISPLAY: Record<string, { label: string; color: string }> = {
  '1P': { label: 'R', color: '#45B7D1' },
  '3M': { label: '3', color: '#FF8E53' },
  '3m': { label: 'b3', color: '#FF8E53' },
  '5P': { label: '5', color: '#FFC145' },
  '5d': { label: 'b5', color: '#FFC145' },
}

function renderShape() {
  if (!containerRef.value || !props.chord || !props.shape) return

  const positions = calculateFretPositions(
    props.chord.root,
    props.chord.type,
    props.shape,
    props.stringSet
  )

  const minFret = Math.min(...positions.map(p => p.fret))
  const maxFret = Math.max(...positions.map(p => p.fret))

  // Recreate fretboard with correct fret range
  if (fretboard) fretboard.clear()
  containerRef.value.innerHTML = ''

  fretboard = new Fretboard({
    el: containerRef.value!,
    stringCount: 6,
    tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'], // Full 6-string guitar
    fretCount: Math.max(maxFret - minFret + 2, 3),
    crop: true,
    fretLeftPadding: 1,
    showFretNumbers: true,
    dotSize: 28,
    dotStrokeWidth: 2,
    dotStrokeColor: 'transparent',
    width: 260,
    height: 200,
    font: 'inherit',
    topPadding: 20,
    bottomPadding: 15,
    leftPadding: 20,
    rightPadding: 20,
    fretNumbersColor: 'rgba(255,255,255,0.4)',
    fretColor: 'rgba(255,255,255,0.2)',
    stringColor: 'rgba(255,255,255,0.3)',
    nutColor: 'rgba(255,255,255,0.4)',
    dotTextSize: 13,
  })

  // Mute strings not in the current set
  const mutedStrings = getMutedStringsForSet(props.stringSet)
  if (mutedStrings.length > 0) {
    fretboard.muteStrings({ strings: mutedStrings })
  }

  const dots = positions.map((p: FretPosition) => ({
    string: p.string,
    fret: p.fret,
    interval: p.interval,
  }))

  fretboard
    .setDots(dots)
    .render()

  // Style each interval with its color and label
  const usedIntervals = [...new Set(positions.map(p => p.interval))]
  for (const interval of usedIntervals) {
    const display = INTERVAL_DISPLAY[interval] ?? { label: interval, color: '#fff' }
    fretboard.style({
      filter: { interval },
      fill: display.color,
      text: () => display.label,
      fontFill: '#000',
      fontSize: 13,
    })
  }
}

onMounted(() => {
  // Fretboard is created on-demand when chord+shape are set
})

watch(
  () => [props.chord, props.shape, props.stringSet],
  async () => {
    await nextTick()
    renderShape()
  },
  { deep: true, immediate: true }
)
</script>

<template>
  <div class="fretboard-wrapper" v-show="chord && shape">
    <div class="shape-label">
      {{ shape }} Shape
    </div>
    <div ref="containerRef" class="fretboard-container" />
  </div>
</template>

<style scoped>
.fretboard-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.shape-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.fretboard-container {
  min-width: 260px;
  min-height: 200px;
}

.fretboard-container :deep(svg) {
  display: block;
}
</style>
