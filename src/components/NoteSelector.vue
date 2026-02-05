<script setup lang="ts">
import { NOTES } from '../utils/notes'

const selectedNotes = defineModel<string[]>({ required: true })

function toggle(noteName: string) {
  const idx = selectedNotes.value.indexOf(noteName)
  if (idx === -1) {
    selectedNotes.value = [...selectedNotes.value, noteName]
  } else {
    selectedNotes.value = selectedNotes.value.filter((n) => n !== noteName)
  }
}

function isSelected(noteName: string) {
  return selectedNotes.value.includes(noteName)
}
</script>

<template>
  <div class="note-selector">
    <button
      v-for="note in NOTES"
      :key="note.name"
      class="note-btn"
      :class="{ selected: isSelected(note.name) }"
      :style="{
        '--note-color': note.color,
        borderColor: isSelected(note.name) ? note.color : 'transparent',
        color: isSelected(note.name) ? note.color : 'rgba(255,255,255,0.4)',
        backgroundColor: isSelected(note.name) ? note.color + '18' : 'rgba(255,255,255,0.05)',
      }"
      @click="toggle(note.name)"
    >
      {{ note.name }}
    </button>
  </div>
</template>

<style scoped>
.note-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  max-width: 500px;
  margin: 0 auto;
}

.note-btn {
  width: 64px;
  height: 48px;
  border-radius: 12px;
  border: 2px solid transparent;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.05);
}

.note-btn:hover {
  border-color: var(--note-color) !important;
  background-color: color-mix(in srgb, var(--note-color) 12%, transparent) !important;
}

.note-btn.selected {
  box-shadow: 0 0 16px color-mix(in srgb, var(--note-color) 40%, transparent);
  transform: scale(1.05);
}
</style>
