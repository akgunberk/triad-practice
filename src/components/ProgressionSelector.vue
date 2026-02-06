<script setup lang="ts">
export type ProgressionMode = "random" | "I-IV-V" | "II-V-I";

const progressionMode = defineModel<ProgressionMode>({ required: true });

const PROGRESSION_OPTIONS: { value: ProgressionMode; label: string }[] = [
  { value: "random", label: "Random Chords" },
  { value: "I-IV-V", label: "I-IV-V Progression" },
  { value: "II-V-I", label: "II-V-I Progression" },
];

function select(mode: ProgressionMode) {
  progressionMode.value = mode;
}

function isSelected(mode: ProgressionMode) {
  return progressionMode.value === mode;
}

const MODE_COLORS: Record<ProgressionMode, string> = {
  random: "#646cff",
  "I-IV-V": "#88D8B0",
  "II-V-I": "#F78FB3",
};
</script>

<template>
  <div class="progression-selector">
    <button
      v-for="option in PROGRESSION_OPTIONS"
      :key="option.value"
      class="progression-btn"
      :class="{ selected: isSelected(option.value) }"
      :style="{
        '--p-color': MODE_COLORS[option.value],
        borderColor: isSelected(option.value)
          ? MODE_COLORS[option.value]
          : 'transparent',
        color: isSelected(option.value)
          ? MODE_COLORS[option.value]
          : 'rgba(255,255,255,0.4)',
        backgroundColor: isSelected(option.value)
          ? MODE_COLORS[option.value] + '18'
          : 'rgba(255,255,255,0.05)',
      }"
      @click="select(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.progression-selector {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.progression-btn {
  padding: 8px 20px;
  border-radius: 12px;
  border: 2px solid transparent;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.05);
}

.progression-btn:hover {
  border-color: var(--p-color) !important;
  background-color: color-mix(in srgb, var(--p-color) 12%, transparent) !important;
}

.progression-btn.selected {
  box-shadow: 0 0 16px color-mix(in srgb, var(--p-color) 40%, transparent);
  transform: scale(1.05);
}
</style>
