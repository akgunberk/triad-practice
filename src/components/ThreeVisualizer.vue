<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { init, dispose, onResize, triggerBeat, setColor } from '../utils/visualizer'
import type { Chord } from '../utils/chordGenerator'
import { getNoteColor } from '../utils/notes'

const props = defineProps<{
  isRunning: boolean
  currentBeat: number
  chord: Chord | null
}>()

const container = ref<HTMLElement | null>(null)

watch(
  () => props.currentBeat,
  (beat) => {
    if (beat === 1 && props.isRunning) {
      triggerBeat()
    }
  }
)

watch(
  () => props.chord,
  (chord) => {
    if (chord) {
      setColor(getNoteColor(chord.root))
    }
  }
)

function handleResize() {
  if (container.value) {
    onResize(container.value.clientWidth, container.value.clientHeight)
  }
}

onMounted(() => {
  if (container.value) {
    init(container.value)
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  dispose()
})
</script>

<template>
  <div ref="container" class="three-container" />
</template>

<style scoped>
.three-container {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
</style>
