<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getSoundfontNames, initInstrument, getInstrumentName } from '../utils/audio'

const instrumentNames = ref<string[]>([])
const selected = ref(getInstrumentName())
const loading = ref(false)

onMounted(() => {
  instrumentNames.value = getSoundfontNames()
})

function capitalize(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

async function handleChange(e: Event) {
  const name = (e.target as HTMLSelectElement).value
  selected.value = name
  loading.value = true
  await initInstrument(name)
  loading.value = false
}

defineExpose({ loading })
</script>

<template>
  <div class="instrument-picker">
    <label class="picker-label">
      <span class="label-text">{{ loading ? '⏳' : '🎵' }}</span>
      <select
        class="picker-select"
        :value="selected"
        :disabled="loading"
        @change="handleChange"
      >
        <option
          v-for="name in instrumentNames"
          :key="name"
          :value="name"
        >
          {{ capitalize(name) }}
        </option>
      </select>
    </label>
  </div>
</template>

<style scoped>
.instrument-picker {
  display: flex;
  justify-content: center;
}

.picker-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label-text {
  font-size: 1.2rem;
}

.picker-select {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 0.85rem;
  font-family: inherit;
  cursor: pointer;
  outline: none;
  min-width: 200px;
  transition: border-color 0.2s;
}

.picker-select:hover {
  border-color: rgba(255, 255, 255, 0.3);
}

.picker-select:focus {
  border-color: #646cff;
}

.picker-select:disabled {
  opacity: 0.5;
  cursor: wait;
}

.picker-select option {
  background: #1a1a2e;
  color: rgba(255, 255, 255, 0.85);
}
</style>
