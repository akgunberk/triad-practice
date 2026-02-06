<script setup lang="ts">
import { NOTES } from "../utils/notes";

const selectedKey = defineModel<string>({ required: true });

function select(noteName: string) {
  selectedKey.value = noteName;
}

function isSelected(noteName: string) {
  return selectedKey.value === noteName;
}
</script>

<template>
  <div class="key-selector-container">
    <label class="key-label">Key:</label>
    <div class="key-selector">
      <button
        v-for="note in NOTES"
        :key="note.name"
        class="key-btn"
        :class="{ selected: isSelected(note.name) }"
        :style="{
          '--note-color': note.color,
          borderColor: isSelected(note.name) ? note.color : 'transparent',
          color: isSelected(note.name)
            ? note.color
            : 'rgba(255,255,255,0.4)',
          backgroundColor: isSelected(note.name)
            ? note.color + '18'
            : 'rgba(255,255,255,0.05)',
        }"
        @click="select(note.name)"
      >
        {{ note.name }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.key-selector-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.key-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.key-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  max-width: 500px;
}

.key-btn {
  width: 56px;
  height: 40px;
  border-radius: 12px;
  border: 2px solid transparent;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.05);
}

.key-btn:hover {
  border-color: var(--note-color) !important;
  background-color: color-mix(in srgb, var(--note-color) 12%, transparent) !important;
}

.key-btn.selected {
  box-shadow: 0 0 16px color-mix(in srgb, var(--note-color) 40%, transparent);
  transform: scale(1.05);
}
</style>
