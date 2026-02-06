<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import BeatDisplay from "./components/BeatDisplay.vue";
import ChordDisplay from "./components/ChordDisplay.vue";
import FretboardDiagram from "./components/FretboardDiagram.vue";
import ThreeVisualizer from "./components/ThreeVisualizer.vue";
import AppSidebar from "./components/AppSidebar.vue";
import type { AppMode, ProgressionType } from "./components/AppSidebar.vue";
import { useMetronome } from "./composables/useMetronome";
import {
  generateRandomChord,
  getChordNoteNames,
  getProgressionChord,
  type Chord,
  type ProgressionMode,
  type ProgressionState,
} from "./utils/chordGenerator";
import {
  initInstrument,
  playChordSound,
  stopChordSound,
  playMetronomeClick,
  fadeOutChord,
} from "./utils/audio";
import {
  pickRandomShape,
  pickRandomStringSet,
  type ShapeName,
  type StringSet,
} from "./utils/triadShapes";
import type { TriadType } from "./utils/notes";
import { Scale } from "tonal";
import {
  getCircleOfFifthsProgression,
  getNextChordInCircle,
  type CircleDirection,
} from "./utils/circleOfFifths";

// Sidebar state
const appMode = ref<AppMode>("random");
const selectedNotes = ref<string[]>(Scale.get("c chromatic").notes.slice(0, 1));
const selectedTypes = ref<TriadType[]>(["Major", "Minor", "Dim"]);
const selectedStringSets = ref<StringSet[]>(["I"]);
const progressionType = ref<ProgressionType>("I-IV-V");
const progressionKey = ref<string>("C");
const circleDirection = ref<CircleDirection>("right");

// Internal state
const progressionIndex = ref<number>(0);
const currentChord = ref<Chord | null>(null);
const currentShape = ref<ShapeName | null>(null);
const currentStringSet = ref<StringSet>("I");
const instrumentReady = ref(false);
const displayChord = ref<Chord | null>(null);
const displayShape = ref<ShapeName | null>(null);
const displayStringSet = ref<StringSet>("I");
let isFirstBeat = false;

// Derived state bridging new appMode to old logic
const isCircleMode = computed(() => appMode.value === "circle");
const isProgressionMode = computed(() => appMode.value === "progression");
const progressionMode = computed<ProgressionMode>(() =>
  appMode.value === "progression" ? progressionType.value : "random",
);

const circleProgression = computed(() =>
  getCircleOfFifthsProgression(circleDirection.value, selectedTypes.value),
);

const canStart = computed(() => {
  if (!instrumentReady.value) return false;
  if (appMode.value === "random" && selectedNotes.value.length === 0)
    return false;
  return true;
});

// Reset circle progression when direction or types change
watch([circleDirection, selectedTypes], () => {
  if (isCircleMode.value && !isRunning.value) {
    currentChord.value = null;
    displayChord.value = null;
  }
});

onMounted(async () => {
  await initInstrument();
  instrumentReady.value = true;
});

function handleBeat(_beat: number) {}

function handleMetronomeClick(isBeat1: boolean) {
  playMetronomeClick(isBeat1);
}

function handleChordTrigger(shouldPlay: boolean) {
  if (
    !isCircleMode.value &&
    !isProgressionMode.value &&
    selectedNotes.value.length === 0
  )
    return;

  if (shouldPlay) {
    if (displayChord.value) {
      currentChord.value = displayChord.value;
      currentShape.value = displayShape.value;
      currentStringSet.value = displayStringSet.value;
      const noteNames = getChordNoteNames(currentChord.value);
      playChordSound(noteNames);
    }
  } else {
    const beatInterval = 60000 / bpm.value;
    fadeOutChord(beatInterval);

    if (!isFirstBeat) {
      if (isCircleMode.value) {
        displayChord.value = getNextChordInCircle(
          displayChord.value ?? undefined,
          circleProgression.value,
        );
      } else if (isProgressionMode.value) {
        progressionIndex.value = (progressionIndex.value + 1) % 3;
        const progressionState: ProgressionState = {
          mode: progressionMode.value as Exclude<ProgressionMode, "random">,
          key: progressionKey.value,
          currentIndex: progressionIndex.value,
        };
        displayChord.value = getProgressionChord(progressionState);
      } else {
        displayChord.value = generateRandomChord(
          selectedNotes.value,
          currentChord.value ?? undefined,
          selectedTypes.value,
        );
      }
      displayStringSet.value = pickRandomStringSet(selectedStringSets.value);
      displayShape.value = pickRandomShape(
        displayStringSet.value,
        displayShape.value ?? undefined,
      );
    } else {
      isFirstBeat = false;
    }
  }
}

const { bpm, currentBeat, isRunning, countdown, start, stop } = useMetronome(
  handleBeat,
  handleMetronomeClick,
  handleChordTrigger,
);

function toggleMetronome() {
  if (isRunning.value) {
    stop();
    stopChordSound();
  } else {
    currentChord.value = null;
    progressionIndex.value = 0;
    if (isCircleMode.value) {
      displayChord.value = getNextChordInCircle(
        undefined,
        circleProgression.value,
      );
    } else if (isProgressionMode.value) {
      const progressionState: ProgressionState = {
        mode: progressionMode.value as Exclude<ProgressionMode, "random">,
        key: progressionKey.value,
        currentIndex: 0,
      };
      displayChord.value = getProgressionChord(progressionState);
    } else {
      displayChord.value = generateRandomChord(
        selectedNotes.value,
        undefined,
        selectedTypes.value,
      );
    }
    displayStringSet.value = pickRandomStringSet(selectedStringSets.value);
    displayShape.value = pickRandomShape(displayStringSet.value, undefined);
    isFirstBeat = true;
    start();
  }
}
</script>

<template>
  <ThreeVisualizer :is-running="isRunning" :current-beat="currentBeat" />

  <AppSidebar
    v-model:app-mode="appMode"
    v-model:circle-direction="circleDirection"
    v-model:progression-type="progressionType"
    v-model:progression-key="progressionKey"
    v-model:selected-notes="selectedNotes"
    v-model:selected-types="selectedTypes"
    v-model:selected-string-sets="selectedStringSets"
    v-model:bpm="bpm"
    :is-running="isRunning"
    :can-start="canStart"
    @toggle="toggleMetronome"
  />

  <div class="app-container">
    <h1 class="app-title">Chord Practicer</h1>

    <div class="main-display">
      <div v-if="countdown > 0" class="countdown">{{ countdown }}</div>
      <template v-else>
        <div class="chord-and-fretboard">
          <ChordDisplay :chord="displayChord" />
          <FretboardDiagram
            :chord="displayChord"
            :shape="displayShape"
            :string-set="displayStringSet"
          />
        </div>
      </template>
      <BeatDisplay :current-beat="currentBeat" />
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
  gap: 16px;
  padding: 24px 16px;
  height: 100vh;
  box-sizing: border-box;
}

.app-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin: 0;
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

.chord-and-fretboard {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
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
