import { ref, watch, onUnmounted } from "vue";

export function useMetronome(
  onBeat: (beat: number) => void,
  onMetronomeClick?: (isBeat1: boolean) => void,
  onChordTrigger?: (shouldPlay: boolean) => void
) {
  const bpm = ref(60);
  const currentBeat = ref(0); // 0 = not started, 1-4 = active beats
  const isRunning = ref(false);
  const countdown = ref(0); // 3, 2, 1, 0 = go

  let timerId: ReturnType<typeof setTimeout> | null = null;
  let expectedTime = 0;

  function tick() {
    const drift = Date.now() - expectedTime;
    const beatInterval = 60000 / bpm.value;

    currentBeat.value = currentBeat.value >= 4 ? 1 : currentBeat.value + 1;
    onBeat(currentBeat.value);

    // Play metronome click on every beat
    if (onMetronomeClick) {
      onMetronomeClick(currentBeat.value === 1);
    }

    // Trigger chord play on beat 4
    if (onChordTrigger) {
      if (currentBeat.value === 4) {
        onChordTrigger(true); // Play chord on beat 4
      } else if (currentBeat.value === 1) {
        onChordTrigger(false); // Start fade on beat 1
      }
    }

    expectedTime += beatInterval;
    timerId = setTimeout(tick, Math.max(0, beatInterval - drift));
  }

  function countdownTick() {
    const beatInterval = 60000 / bpm.value;

    if (countdown.value > 1) {
      countdown.value--;
      timerId = setTimeout(countdownTick, beatInterval);
    } else {
      // Countdown finished — start the metronome
      countdown.value = 0;
      currentBeat.value = 0;
      expectedTime = Date.now() + beatInterval;
      tick();
    }
  }

  function start() {
    if (isRunning.value) return;
    isRunning.value = true;
    currentBeat.value = 0;
    countdown.value = 3;
    const beatInterval = 60000 / bpm.value;
    timerId = setTimeout(countdownTick, beatInterval);
  }

  function stop() {
    isRunning.value = false;
    countdown.value = 0;
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    currentBeat.value = 0;
  }

  // Restart with new BPM if running
  watch(bpm, () => {
    if (isRunning.value && countdown.value === 0) {
      stop();
      start();
    }
  });

  onUnmounted(() => {
    if (timerId !== null) clearTimeout(timerId);
  });

  return { bpm, currentBeat, isRunning, countdown, start, stop };
}
