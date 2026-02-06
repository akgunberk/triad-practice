<script setup lang="ts">
import { TRIAD_TYPES, type TriadType } from '../utils/notes'

const selectedTypes = defineModel<TriadType[]>({ required: true })

function toggle(type: TriadType) {
  const idx = selectedTypes.value.indexOf(type)
  if (idx === -1) {
    selectedTypes.value = [...selectedTypes.value, type]
  } else if (selectedTypes.value.length > 1) {
    selectedTypes.value = selectedTypes.value.filter((t) => t !== type)
  }
}

function isSelected(type: TriadType) {
  return selectedTypes.value.includes(type)
}

const TYPE_COLORS: Record<TriadType, string> = {
  Major: '#646cff',
  Minor: '#f78fb3',
  Dim: '#ffc145',
}
</script>

<template>
  <div class="quality-selector">
    <button
      v-for="type in TRIAD_TYPES"
      :key="type"
      class="quality-btn"
      :class="{ selected: isSelected(type) }"
      :style="{
        '--q-color': TYPE_COLORS[type],
        borderColor: isSelected(type) ? TYPE_COLORS[type] : 'transparent',
        color: isSelected(type) ? TYPE_COLORS[type] : 'rgba(255,255,255,0.4)',
        backgroundColor: isSelected(type) ? TYPE_COLORS[type] + '18' : 'rgba(255,255,255,0.05)',
      }"
      @click="toggle(type)"
    >
      {{ type }}
    </button>
  </div>
</template>

<style scoped>
.quality-selector {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.quality-btn {
  padding: 8px 20px;
  border-radius: 12px;
  border: 2px solid transparent;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.05);
}

.quality-btn:hover {
  border-color: var(--q-color) !important;
  background-color: color-mix(in srgb, var(--q-color) 12%, transparent) !important;
}

.quality-btn.selected {
  box-shadow: 0 0 16px color-mix(in srgb, var(--q-color) 40%, transparent);
  transform: scale(1.05);
}
</style>
