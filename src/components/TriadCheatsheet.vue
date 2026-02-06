<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Fretboard } from '@moonwave99/fretboard.js'
import type { TriadType } from '../utils/notes'
import {
  calculateFretPositions,
  SHAPE_NAMES,
  type FretPosition,
} from '../utils/triadShapes'

const props = defineProps<{
  selectedTypes: TriadType[]
}>()

const containerRefs = ref<Record<string, HTMLElement | null>>({})
const fretboards = ref<Record<string, InstanceType<typeof Fretboard> | null>>({})

const INTERVAL_DISPLAY: Record<string, { label: string; color: string }> = {
  '1P': { label: 'R', color: '#45B7D1' },
  '3M': { label: '3', color: '#FF8E53' },
  '3m': { label: 'b3', color: '#FF8E53' },
  '5P': { label: '5', color: '#FFC145' },
  '5d': { label: 'b5', color: '#FFC145' },
}

const TYPE_COLORS: Record<TriadType, string> = {
  Major: '#646cff',
  Minor: '#f78fb3',
  Dim: '#ffc145',
}

function setContainerRef(key: string, el: HTMLElement | null) {
  containerRefs.value[key] = el
}

async function renderShapes() {
  await nextTick()
  
  for (const type of props.selectedTypes) {
    for (const shape of SHAPE_NAMES) {
      const key = `${type}-${shape}`
      const container = containerRefs.value[key]
      
      if (!container) continue
      
      // Clear existing fretboard
      if (fretboards.value[key]) {
        fretboards.value[key]!.clear()
      }
      container.innerHTML = ''
      
      // Use C as reference note for display (doesn't matter which note)
      const positions = calculateFretPositions('C', type, shape)
      
      const minFret = Math.min(...positions.map(p => p.fret))
      const maxFret = Math.max(...positions.map(p => p.fret))
      
      const fretboard = new Fretboard({
        el: container,
        stringCount: 3,
        tuning: ['G3', 'B3', 'E4'],
        fretCount: Math.max(maxFret - minFret + 2, 3),
        crop: true,
        fretLeftPadding: 1,
        showFretNumbers: false,
        dotSize: 20,
        dotStrokeWidth: 2,
        dotStrokeColor: 'transparent',
        width: 180,
        height: 120,
        font: 'inherit',
        topPadding: 12,
        bottomPadding: 10,
        leftPadding: 15,
        rightPadding: 15,
        fretColor: 'rgba(255,255,255,0.15)',
        stringColor: 'rgba(255,255,255,0.25)',
        nutColor: 'rgba(255,255,255,0.3)',
        dotTextSize: 11,
      })
      
      const dots = positions.map((p: FretPosition) => ({
        string: p.string,
        fret: p.fret,
        interval: p.interval,
      }))
      
      fretboard.setDots(dots).render()
      
      // Style each interval with its color and label
      const usedIntervals = [...new Set(positions.map(p => p.interval))]
      for (const interval of usedIntervals) {
        const display = INTERVAL_DISPLAY[interval] ?? { label: interval, color: '#fff' }
        fretboard.style({
          filter: { interval },
          fill: display.color,
          text: () => display.label,
          fontFill: '#000',
          fontSize: 11,
        })
      }
      
      fretboards.value[key] = fretboard
    }
  }
}

watch(
  () => props.selectedTypes,
  () => {
    renderShapes()
  },
  { deep: true, immediate: true }
)
</script>

<template>
  <div class="cheatsheet">
    <h3 class="cheatsheet-title">Triad Shapes</h3>
    
    <div class="shapes-grid">
      <div 
        v-for="type in selectedTypes" 
        :key="type"
        class="type-section"
      >
        <div 
          class="type-header"
          :style="{ color: TYPE_COLORS[type] }"
        >
          {{ type }}
        </div>
        
        <div class="shapes-row">
          <div 
            v-for="shape in SHAPE_NAMES" 
            :key="shape"
            class="shape-item"
          >
            <div class="shape-name">{{ shape }}</div>
            <div 
              :ref="(el) => setContainerRef(`${type}-${shape}`, el as HTMLElement)"
              class="shape-diagram"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cheatsheet {
  position: fixed;
  right: 0;
  top: 0;
  width: 240px;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px 12px;
  box-sizing: border-box;
  overflow-y: auto;
  z-index: 10;
}

.cheatsheet-title {
  font-size: 1rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin: 0 0 20px 0;
  text-align: center;
}

.shapes-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.type-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.type-header {
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-align: center;
  padding-bottom: 4px;
  border-bottom: 2px solid currentColor;
}

.shapes-row {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.shape-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 8px 4px;
}

.shape-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.1em;
}

.shape-diagram {
  width: 180px;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shape-diagram :deep(svg) {
  display: block;
}

/* Scrollbar styling */
.cheatsheet::-webkit-scrollbar {
  width: 6px;
}

.cheatsheet::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.cheatsheet::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.cheatsheet::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
