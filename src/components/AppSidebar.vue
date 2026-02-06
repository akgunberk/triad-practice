<script setup lang="ts">
import { ref } from "vue";
import NoteSelector from "./NoteSelector.vue";
import QualitySelector from "./QualitySelector.vue";
import StringSetSelector from "./StringSetSelector.vue";
import KeySelector from "./KeySelector.vue";
import TempoSlider from "./TempoSlider.vue";
import StartStopButton from "./StartStopButton.vue";
import type { TriadType } from "../utils/notes";
import type { StringSet } from "../utils/stringSetTypes";
import type { CircleDirection } from "../utils/circleOfFifths";

export type AppMode = "random" | "circle" | "progression";
export type ProgressionType = "I-IV-V" | "II-V-I";

const appMode = defineModel<AppMode>("appMode", { required: true });
const circleDirection = defineModel<CircleDirection>("circleDirection", {
  required: true,
});
const progressionType = defineModel<ProgressionType>("progressionType", {
  required: true,
});
const progressionKey = defineModel<string>("progressionKey", {
  required: true,
});
const selectedNotes = defineModel<string[]>("selectedNotes", {
  required: true,
});
const selectedTypes = defineModel<TriadType[]>("selectedTypes", {
  required: true,
});
const selectedStringSets = defineModel<StringSet[]>("selectedStringSets", {
  required: true,
});
const bpm = defineModel<number>("bpm", { required: true });

defineProps<{
  isRunning: boolean;
  canStart: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
}>();

const isOpen = ref(false);

function selectMode(mode: AppMode) {
  appMode.value = mode;
}

const MODE_OPTIONS: { value: AppMode; label: string; icon: string }[] = [
  { value: "random", label: "Random Chords", icon: "🎲" },
  { value: "circle", label: "Circle of 5ths/4ths", icon: "⭕" },
  { value: "progression", label: "Progressions", icon: "🎵" },
];
</script>

<template>
  <!-- Hamburger button -->
  <button
    v-show="!isOpen"
    class="hamburger-btn"
    @click="isOpen = true"
    aria-label="Open settings"
  >
    <span class="hamburger-icon">
      <span /><span /><span />
    </span>
  </button>

  <!-- Backdrop -->
  <Transition name="backdrop">
    <div v-if="isOpen" class="sidebar-backdrop" @click="isOpen = false" />
  </Transition>

  <!-- Sidebar -->
  <Transition name="sidebar">
    <aside v-if="isOpen" class="sidebar">
      <div class="sidebar-header">
        <h2 class="sidebar-title">Settings</h2>
        <button class="close-btn" @click="isOpen = false" aria-label="Close">
          ✕
        </button>
      </div>

      <div class="sidebar-content">
        <!-- Mode Selection -->
        <section class="sidebar-section">
          <h3 class="section-label">Mode</h3>
          <div class="mode-tabs">
            <button
              v-for="opt in MODE_OPTIONS"
              :key="opt.value"
              class="mode-tab"
              :class="{ active: appMode === opt.value }"
              @click="selectMode(opt.value)"
            >
              <span class="mode-icon">{{ opt.icon }}</span>
              <span class="mode-label">{{ opt.label }}</span>
            </button>
          </div>
        </section>

        <!-- Contextual: Random mode options -->
        <template v-if="appMode === 'random'">
          <section class="sidebar-section">
            <h3 class="section-label">Root Notes</h3>
            <NoteSelector v-model="selectedNotes" />
          </section>
          <section class="sidebar-section">
            <h3 class="section-label">Chord Quality</h3>
            <QualitySelector v-model="selectedTypes" />
          </section>
        </template>

        <!-- Contextual: Circle mode options -->
        <template v-if="appMode === 'circle'">
          <section class="sidebar-section">
            <h3 class="section-label">Direction</h3>
            <div class="direction-btns">
              <button
                class="option-btn"
                :class="{ active: circleDirection === 'right' }"
                @click="circleDirection = 'right'"
              >
                → Fifths
              </button>
              <button
                class="option-btn"
                :class="{ active: circleDirection === 'left' }"
                @click="circleDirection = 'left'"
              >
                ← Fourths
              </button>
            </div>
          </section>
          <section class="sidebar-section">
            <h3 class="section-label">Chord Quality</h3>
            <QualitySelector v-model="selectedTypes" />
          </section>
        </template>

        <!-- Contextual: Progression mode options -->
        <template v-if="appMode === 'progression'">
          <section class="sidebar-section">
            <h3 class="section-label">Progression</h3>
            <div class="direction-btns">
              <button
                class="option-btn"
                :class="{ active: progressionType === 'I-IV-V' }"
                @click="progressionType = 'I-IV-V'"
              >
                I – IV – V
              </button>
              <button
                class="option-btn"
                :class="{ active: progressionType === 'II-V-I' }"
                @click="progressionType = 'II-V-I'"
              >
                II – V – I
              </button>
            </div>
          </section>
          <section class="sidebar-section">
            <h3 class="section-label">Key</h3>
            <KeySelector v-model="progressionKey" />
          </section>
        </template>

        <!-- Always visible: String Sets -->
        <section class="sidebar-section">
          <StringSetSelector v-model="selectedStringSets" />
        </section>

        <!-- Tempo -->
        <section class="sidebar-section">
          <TempoSlider v-model="bpm" />
        </section>
      </div>

      <!-- Start/Stop pinned to bottom -->
      <div class="sidebar-footer">
        <StartStopButton
          :is-running="isRunning"
          :disabled="!canStart"
          @toggle="emit('toggle')"
        />
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.hamburger-btn {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 100;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 15, 21, 0.7);
  backdrop-filter: blur(12px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.hamburger-btn:hover {
  background: rgba(100, 108, 255, 0.15);
  border-color: rgba(100, 108, 255, 0.4);
}

.hamburger-icon {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hamburger-icon span {
  display: block;
  width: 20px;
  height: 2px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 1px;
}

/* Backdrop */
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.5);
}

.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.3s ease;
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

/* Sidebar */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 300;
  width: 320px;
  display: flex;
  flex-direction: column;
  background: rgba(12, 12, 20, 0.92);
  backdrop-filter: blur(24px);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 4px 0 32px rgba(0, 0, 0, 0.5);
}

.sidebar-enter-active,
.sidebar-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar-enter-from,
.sidebar-leave-to {
  transform: translateX(-100%);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.sidebar-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.5);
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.close-btn:hover {
  background: rgba(255, 107, 107, 0.15);
  color: #ff6b6b;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sidebar-content::-webkit-scrollbar {
  width: 4px;
}
.sidebar-content::-webkit-scrollbar-track {
  background: transparent;
}
.sidebar-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 2px;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin: 0;
}

/* Mode tabs */
.mode-tabs {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mode-tab {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.9rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.mode-tab:hover {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.7);
}

.mode-tab.active {
  background: rgba(100, 108, 255, 0.12);
  border-color: rgba(100, 108, 255, 0.4);
  color: #646cff;
}

.mode-icon {
  font-size: 1.1rem;
  width: 24px;
  text-align: center;
}

/* Option buttons (direction, progression type) */
.direction-btns {
  display: flex;
  gap: 6px;
}

.option-btn {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.85rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-btn:hover {
  border-color: rgba(100, 108, 255, 0.3);
  background: rgba(100, 108, 255, 0.08);
}

.option-btn.active {
  border-color: rgba(100, 108, 255, 0.5);
  background: rgba(100, 108, 255, 0.15);
  color: #646cff;
}

/* Footer */
.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  justify-content: center;
}
</style>
