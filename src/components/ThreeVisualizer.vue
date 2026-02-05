<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { init, dispose, onResize, triggerBeat } from '../utils/visualizer'

const props = defineProps<{
  isRunning: boolean
  currentBeat: number
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
