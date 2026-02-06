<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NoteSelector from './components/NoteSelector.vue'
import TempoSlider from './components/TempoSlider.vue'
import BeatDisplay from './components/BeatDisplay.vue'
import ChordDisplay from './components/ChordDisplay.vue'
import StartStopButton from './components/StartStopButton.vue'
import ThreeVisualizer from './components/ThreeVisualizer.vue'
import InstrumentPicker from './components/InstrumentPicker.vue'
import { useMetronome } from './composables/useMetronome'
import { generateRandomChord, getChordNoteNames, type Chord } from './utils/chordGenerator'
import { initInstrument, playChordSound, stopChordSound, playMetronomeClick, fadeOutChord } from './utils/audio'

const selectedNotes = ref<string[]>([])
const currentChord = ref<Chord | null>(null)
const instrumentReady = ref(false)

onMounted(async () => {
  await initInstrument()
  instrumentReady.value = true
})

function handleBeat(_beat: number) {
  // Display beat (handled by BeatDisplay component)
}

function handleMetronomeClick(isBeat1: boolean) {
  // Play metronome click sound
  playMetronomeClick(isBeat1)
}

function handleChordTrigger(shouldPlay: boolean) {
  if (selectedNotes.value.length === 0) return

  if (shouldPlay) {
    // Beat 4: play new chord
    currentChord.value = generateRandomChord(
      selectedNotes.value,
      currentChord.value ?? undefined
    )
    const noteNames = getChordNoteNames(currentChord.value)
    playChordSound(noteNames)
  } else {
    // Beat 1: fade out current chord over 1 beat duration
    const beatInterval = 60000 / bpm.value
    fadeOutChord(beatInterval)
  }
}

const { bpm, currentBeat, isRunning, countdown, start, stop } = useMetronome(
  handleBeat,
  handleMetronomeClick,
  handleChordTrigger
)

function toggleMetronome() {
  if (isRunning.value) {
    stop()
    stopChordSound()
  } else {
    currentChord.value = null
    start()
  }
}
</script>

<template>
  <ThreeVisualizer :is-running="isRunning" :current-beat="currentBeat" />
  <div class="app-container">
    <h1 class="app-title">Chord Practicer</h1>
    <p class="app-subtitle">Select the notes you want to practice — random triads will be shown on each beat.</p>

    <div class="controls-section">
      <NoteSelector v-model="selectedNotes" />
    </div>

    <div class="controls-row">
      <TempoSlider v-model="bpm" />
      <InstrumentPicker />
    </div>

    <div class="main-display">
      <div v-if="countdown > 0" class="countdown">{{ countdown }}</div>
      <ChordDisplay v-else :chord="currentChord" />
      <BeatDisplay :current-beat="currentBeat" />
    </div>

    <div class="controls-section">
      <StartStopButton
        :is-running="isRunning"
        :disabled="selectedNotes.length === 0 || !instrumentReady"
        @toggle="toggleMetronome"
      />
    </div>
  </div>
</template>

<style scoped>
.app-container {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 24px 16px;
  height: 100vh;
  box-sizing: border-box;
  overflow: hidden;
}

.app-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin: 0;
}

.app-subtitle {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.3);
  margin: -20px 0 0;
  max-width: 400px;
  line-height: 1.4;
}

.controls-section {
  width: 100%;
  display: flex;
  justify-content: center;
}

.controls-row {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.main-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  flex: 1;
  justify-content: center;
  min-height: 0;
}

.countdown {
  font-size: clamp(5rem, 15vw, 10rem);
  font-weight: 900;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 0 40px rgba(100, 108, 255, 0.6);
  animation: countdown-pulse 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  user-select: none;
}

@keyframes countdown-pulse {
  0% {
    opacity: 0;
    transform: scale(1.6);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
