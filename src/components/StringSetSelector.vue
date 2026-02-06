<script setup lang="ts">
import { STRING_SETS, type StringSet } from '../utils/stringSetTypes'

const model = defineModel<StringSet[]>({ default: () => ['I'] })

function toggleSet(setId: StringSet) {
  const index = model.value.indexOf(setId)
  if (index === -1) {
    model.value = [...model.value, setId]
  } else {
    // Don't allow deselecting all sets
    if (model.value.length > 1) {
      model.value = model.value.filter(s => s !== setId)
    }
  }
}

function isSelected(setId: StringSet): boolean {
  return model.value.includes(setId)
}
</script>

<template>
  <div class="string-set-selector">
    <h3 class="selector-title">String Sets</h3>
    <div class="sets-grid">
      <button
        v-for="set in STRING_SETS"
        :key="set.id"
        :class="['set-button', { active: isSelected(set.id) }]"
        @click="toggleSet(set.id)"
      >
        <div class="set-name">{{ set.name }}</div>
        <div class="set-strings">{{ set.strings }}</div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.string-set-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.selector-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin: 0;
}

.sets-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.set-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.5);
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 70px;
}

.set-button:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.25);
}

.set-button.active {
  background: rgba(100, 108, 255, 0.2);
  border-color: rgba(100, 108, 255, 0.6);
  color: rgba(255, 255, 255, 0.9);
}

.set-name {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.set-strings {
  font-size: 0.75rem;
  font-weight: 500;
  opacity: 0.8;
  letter-spacing: 0.1em;
}
</style>
