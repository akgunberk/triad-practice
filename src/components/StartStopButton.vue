<script setup lang="ts">
defineProps<{
  isRunning: boolean
  disabled: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()
</script>

<template>
  <button
    class="start-stop-btn"
    :class="{ running: isRunning }"
    :disabled="disabled"
    @click="emit('toggle')"
  >
    {{ isRunning ? 'Stop' : 'Start' }}
  </button>
</template>

<style scoped>
.start-stop-btn {
  padding: 14px 48px;
  font-size: 1.1rem;
  font-weight: 700;
  border-radius: 16px;
  border: 2px solid #646cff;
  background: #646cff;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.start-stop-btn:hover:not(:disabled) {
  background: #535bf2;
  border-color: #535bf2;
  box-shadow: 0 0 24px rgba(100, 108, 255, 0.4);
  transform: translateY(-1px);
}

.start-stop-btn.running {
  background: transparent;
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.start-stop-btn.running:hover {
  background: rgba(255, 107, 107, 0.1);
  box-shadow: 0 0 24px rgba(255, 107, 107, 0.3);
}

.start-stop-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.3);
}
</style>
