<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Chord } from '../utils/chordGenerator'
import { formatChord } from '../utils/chordGenerator'
import { getNoteColor } from '../utils/notes'

const props = defineProps<{
  chord: Chord | null
}>()

const animKey = ref(0)

watch(
  () => props.chord,
  () => {
    animKey.value++
  }
)

const chordText = computed(() => (props.chord ? formatChord(props.chord) : '—'))
const chordColor = computed(() => (props.chord ? getNoteColor(props.chord.root) : '#ffffff'))
</script>

<template>
  <div class="chord-display">
    <div :key="animKey" class="chord-text" :style="{ color: chordColor }">
      {{ chordText }}
    </div>
    <div
      v-if="chord"
      class="chord-glow"
      :style="{ background: `radial-gradient(circle, ${chordColor}20 0%, transparent 70%)` }"
    />
  </div>
</template>

<style scoped>
.chord-display {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  z-index: 1;
}

.chord-text {
  font-size: clamp(4rem, 12vw, 8rem);
  font-weight: 900;
  letter-spacing: -0.02em;
  text-shadow: 0 0 40px currentColor;
  animation: chord-enter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  user-select: none;
}

.chord-glow {
  position: absolute;
  inset: -60px;
  border-radius: 50%;
  pointer-events: none;
  animation: glow-fade 0.5s ease-out;
}

@keyframes chord-enter {
  0% {
    opacity: 0;
    transform: scale(0.7);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes glow-fade {
  0% {
    opacity: 0.8;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
