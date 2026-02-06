<script setup lang="ts">
const bpm = defineModel<number>({ required: true })
</script>

<template>
  <div class="tempo-slider">
    <div class="tempo-label">
      <span class="tempo-value">{{ bpm }}</span>
      <span class="tempo-unit">BPM</span>
    </div>
    <input
      type="range"
      :min="40"
      :max="120"
      :value="bpm"
      class="slider"
      @input="bpm = Number(($event.target as HTMLInputElement).value)"
    />
    <div class="tempo-range">
      <span>40</span>
      <span>120</span>
    </div>
  </div>
</template>

<style scoped>
.tempo-slider {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.tempo-label {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.tempo-value {
  font-size: 2.4rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: #fff;
  min-width: 3ch;
  text-align: center;
}

.tempo-unit {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #646cff;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(100, 108, 255, 0.5);
  transition: box-shadow 0.2s;
}

.slider::-webkit-slider-thumb:hover {
  box-shadow: 0 0 20px rgba(100, 108, 255, 0.8);
}

.slider::-moz-range-thumb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #646cff;
  border: none;
  cursor: pointer;
}

.tempo-range {
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.25);
}
</style>
