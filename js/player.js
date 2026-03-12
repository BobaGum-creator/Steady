/**
 * player.js - Guided Exercise Player Module
 *
 * Manages timer, step progression, and breathing animation state for guided exercises.
 * Uses a callback pattern to provide state updates without directly manipulating the DOM.
 */

/**
 * Create a player instance that manages exercise playback
 * @param {Object} callbacks - Callback functions for state changes
 * @param {Function} callbacks.onStepChange - Called when advancing to a new step
 * @param {Function} callbacks.onTick - Called every second with timing info
 * @param {Function} callbacks.onComplete - Called when exercise finishes
 * @param {Function} callbacks.onPause - Called when exercise is paused
 * @param {Function} callbacks.onResume - Called when exercise resumes
 * @returns {Object} Player object with control methods
 */
export function createPlayer(callbacks = {}) {
  let exercise = null;
  let steps = [];
  let stepIndex = 0;
  let playing = false;
  let paused = false;
  let totalElapsed = 0;
  let stepElapsed = 0;
  let intervalId = null;

  /**
   * Internal tick function called every 1000ms to update timing
   */
  function tick() {
    if (!playing || paused) return;

    totalElapsed++;
    stepElapsed++;

    const step = steps[stepIndex];
    const stepDuration = step?.duration || null;

    // Notify about timing update
    callbacks.onTick?.(totalElapsed, stepElapsed, stepDuration);

    // Auto-advance if this is a timed step and duration has expired
    if (stepDuration !== null && stepElapsed >= stepDuration) {
      advanceStep();
    }
  }

  /**
   * Move to the next step in the exercise
   */
  function advanceStep() {
    stepIndex++;
    stepElapsed = 0;

    // Check if we've completed all steps
    if (stepIndex >= steps.length) {
      complete();
      return;
    }

    // Notify about the step change
    const currentStep = steps[stepIndex];
    callbacks.onStepChange?.(currentStep, stepIndex, steps.length);
  }

  /**
   * Mark the exercise as complete and clean up
   */
  function complete() {
    playing = false;
    paused = false;

    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }

    callbacks.onComplete?.();
  }

  /**
   * Start playing an exercise
   * @param {Object} exerciseData - Exercise object with steps array
   */
  function start(exerciseData) {
    // If already playing, stop first to reset state
    if (playing) {
      stop();
    }

    exercise = exerciseData;
    steps = exerciseData.steps || [];
    stepIndex = 0;
    totalElapsed = 0;
    stepElapsed = 0;
    playing = true;
    paused = false;

    // Start the interval timer
    intervalId = setInterval(tick, 1000);

    // Notify about the first step
    if (steps.length > 0) {
      callbacks.onStepChange?.(steps[0], 0, steps.length);
    }
  }

  /**
   * Pause the exercise (preserves state)
   */
  function pause() {
    if (!playing || paused) return;

    paused = true;

    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }

    callbacks.onPause?.();
  }

  /**
   * Resume a paused exercise
   */
  function resume() {
    if (!playing || !paused) return;

    paused = false;
    intervalId = setInterval(tick, 1000);

    callbacks.onResume?.();
  }

  /**
   * Restart the exercise from the beginning
   */
  function restart() {
    if (playing) {
      stop();
    }

    start(exercise);
  }

  /**
   * Stop the exercise and clean up all state
   */
  function stop() {
    playing = false;
    paused = false;

    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }

    exercise = null;
    steps = [];
    stepIndex = 0;
    totalElapsed = 0;
    stepElapsed = 0;
  }

  /**
   * Skip to the next step (for user-paced steps)
   */
  function skip() {
    if (!playing) return;

    advanceStep();
  }

  /**
   * Get current player state
   * @returns {Object} State object with playback info
   */
  function getState() {
    const step = steps[stepIndex];
    const totalDuration = steps.reduce((sum, s) => {
      return sum + (s.duration || 0);
    }, 0);

    return {
      playing,
      paused,
      currentStep: step || null,
      stepIndex,
      totalSteps: steps.length,
      elapsed: totalElapsed,
      stepElapsed,
      stepDuration: step?.duration || null,
      totalDuration,
      exerciseName: exercise?.name || null
    };
  }

  /**
   * Check if currently playing
   * @returns {boolean}
   */
  function isPlaying() {
    return playing;
  }

  /**
   * Check if currently paused
   * @returns {boolean}
   */
  function isPaused() {
    return paused;
  }

  // Public API
  return {
    start,
    pause,
    resume,
    restart,
    stop,
    skip,
    getState,
    isPlaying,
    isPaused
  };
}
