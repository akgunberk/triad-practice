<script setup lang="ts">
export type CircleDirection = 'right' | 'left'

const isCircleMode = defineModel<boolean>('circleMode', { required: true })
const direction = defineModel<CircleDirection>('direction', { required: true })

function toggleMode() {
  isCircleMode.value = !isCircleMode.value
}
</script>

<template>
  <div class="circle-mode-selector">
    <div class="mode-toggle">
      <label class="mode-label">
        <input 
          type="checkbox" 
          :checked="isCircleMode"
          @change="toggleMode"
        />
        <span>Circle of Fifths/Fourths Mode</span>
      </label>
    </div>
    
    <div v-if="isCircleMode" class="direction-selector">
      <button
        class="direction-btn"
        :class="{ selected: direction === 'right' }"
        @click="direction = 'right'"
      >
        → Fifths (Clockwise)
      </button>
      <button
        class="direction-btn"
        :class="{ selected: direction === 'left' }"
        @click="direction = 'left'"
      >
        ← Fourths (Counter-clockwise)
      </button>
    </div>
  </div>
</template>

<style scoped>
.circle-mode-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  width: 100%;
}

.mode-toggle {
  display: flex;
  justify-content: center;
}

.mode-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
}

.mode-label:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
}

.mode-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #646cff;
}

.direction-selector {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.direction-btn {
  padding: 8px 20px;
  border-radius: 12px;
  border: 2px solid transparent;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.4);
}

.direction-btn:hover {
  border-color: #646cff;
  background-color: rgba(100, 108, 255, 0.12);
}

.direction-btn.selected {
  border-color: #646cff;
  color: #646cff;
  background-color: rgba(100, 108, 255, 0.18);
  box-shadow: 0 0 16px rgba(100, 108, 255, 0.4);
  transform: scale(1.05);
}
</style>
