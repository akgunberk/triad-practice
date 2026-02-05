<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  currentBeat: number
}>()

const beats = [1, 2, 3, 4]

const activeBeat = computed(() => props.currentBeat)
</script>

<template>
  <div class="beat-display">
    <div
      v-for="beat in beats"
      :key="beat"
      class="beat-dot"
      :class="{ active: activeBeat === beat, pulse: activeBeat === beat }"
    >
      {{ beat }}
    </div>
  </div>
</template>

<style scoped>
.beat-display {
  display: flex;
  gap: 16px;
  justify-content: center;
  align-items: center;
}

.beat-dot {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.1s ease;
}

.beat-dot.active {
  color: #fff;
  background: rgba(100, 108, 255, 0.3);
  box-shadow: 0 0 20px rgba(100, 108, 255, 0.5);
  transform: scale(1.15);
}

.beat-dot.pulse {
  animation: beat-pulse 0.2s ease-out;
}

@keyframes beat-pulse {
  0% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1.15);
  }
}
</style>
