<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import NoteSelector from "./components/NoteSelector.vue";
import TempoSlider from "./components/TempoSlider.vue";
import BeatDisplay from "./components/BeatDisplay.vue";
import ChordDisplay from "./components/ChordDisplay.vue";
import FretboardDiagram from "./components/FretboardDiagram.vue";
import QualitySelector from "./components/QualitySelector.vue";
import StartStopButton from "./components/StartStopButton.vue";
import ThreeVisualizer from "./components/ThreeVisualizer.vue";
import StringSetSelector from "./components/StringSetSelector.vue";
import CircleModeSelector from "./components/CircleModeSelector.vue";
import ProgressionSelector from "./components/ProgressionSelector.vue";
import KeySelector from "./components/KeySelector.vue";
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

const selectedNotes = ref<string[]>(Scale.get("c chromatic").notes);
const selectedTypes = ref<TriadType[]>(["Major", "Minor", "Dim"]);
const selectedStringSets = ref<StringSet[]>(["I"]);
const progressionMode = ref<ProgressionMode>("random");
const progressionKey = ref<string>("C");
const progressionIndex = ref<number>(0);
const currentChord = ref<Chord | null>(null);
const currentShape = ref<ShapeName | null>(null);
const currentStringSet = ref<StringSet>("I");
const instrumentReady = ref(false);
// The chord that is currently displayed (preview for upcoming beat 4)
const displayChord = ref<Chord | null>(null);
const displayShape = ref<ShapeName | null>(null);
const displayStringSet = ref<StringSet>("I");
let isFirstBeat = false;

// Circle of Fifths mode
const isCircleMode = ref(false);
const circleDirection = ref<CircleDirection>("right");
const circleProgression = computed(() =>
  getCircleOfFifthsProgression(circleDirection.value, selectedTypes.value),
);

// Reset circle progression when direction or types change
watch([circleDirection, selectedTypes], () => {
  if (isCircleMode.value && !isRunning.value) {
    currentChord.value = null;
    displayChord.value = null;
  }
});

const isProgressionMode = computed(() => progressionMode.value !== "random");

onMounted(async () => {
  await initInstrument();
  instrumentReady.value = true;
});

function handleBeat(_beat: number) {
  // Display beat (handled by BeatDisplay component)
}

function handleMetronomeClick(isBeat1: boolean) {
  // Play metronome click sound
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
    // Beat 4: play audio for the already-displayed chord
    if (displayChord.value) {
      currentChord.value = displayChord.value;
      currentShape.value = displayShape.value;
      currentStringSet.value = displayStringSet.value;
      const noteNames = getChordNoteNames(currentChord.value);
      playChordSound(noteNames);
    }
  } else {
    // Beat 1: fade out previous audio
    const beatInterval = 60000 / bpm.value;
    fadeOutChord(beatInterval);

    // Only generate new chord on beat 1 if NOT the first beat
    if (!isFirstBeat) {
      if (isCircleMode.value) {
        // Circle mode: get next chord in progression
        displayChord.value = getNextChordInCircle(
          displayChord.value ?? undefined,
          circleProgression.value,
        );
      } else if (isProgressionMode.value) {
        // Progression mode: get next chord in progression
        progressionIndex.value = (progressionIndex.value + 1) % 3;
        const progressionState: ProgressionState = {
          mode: progressionMode.value as Exclude<ProgressionMode, "random">,
          key: progressionKey.value,
          currentIndex: progressionIndex.value,
        };
        displayChord.value = getProgressionChord(progressionState);
      } else {
        // Random mode: generate random chord
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
    currentShape.value = null;
    displayChord.value = null;
    displayShape.value = null;
  } else {
    currentChord.value = null;
    progressionIndex.value = 0;
    // Generate first chord+shape+stringSet before countdown
    if (isCircleMode.value) {
      // Circle mode: start from the first chord in progression
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
      // Random mode: generate random chord
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

  <!-- <TriadCheatsheet  :selected-types="selectedTypes" /> -->
  <div class="app-container">
    <h1 class="app-title">Chord Practicer</h1>
    <p class="app-subtitle">
      Select the notes you want to practice — random triads will be shown on
      each beat.
    </p>

    <div class="controls-section">
      <CircleModeSelector
        v-model:circle-mode="isCircleMode"
        v-model:direction="circleDirection"
      />
    </div>

    <div class="controls-section" v-if="!isCircleMode">
      <ProgressionSelector v-model="progressionMode" />
    </div>

    <div class="controls-section" v-if="!isCircleMode && isProgressionMode">
      <KeySelector v-model="progressionKey" />
    </div>

    <div class="controls-section" v-if="!isCircleMode && !isProgressionMode">
      <NoteSelector v-model="selectedNotes" />
    </div>

    <div class="controls-section" v-if="!isCircleMode && !isProgressionMode">
      <QualitySelector v-model="selectedTypes" />
    </div>

    <div class="controls-section">
      <StringSetSelector v-model="selectedStringSets" />
    </div>

    <div class="controls-row">
      <TempoSlider v-model="bpm" />
    </div>

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

    <div class="controls-section">
      <StartStopButton
        :is-running="isRunning"
        :disabled="
          (!isCircleMode && !isProgressionMode && selectedNotes.length === 0) ||
          !instrumentReady
        "
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
  gap: 12px;
  padding: 16px 16px;
  padding-right: 256px;
  height: 100vh;
  box-sizing: border-box;
  /* overflow: hidden; */
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
