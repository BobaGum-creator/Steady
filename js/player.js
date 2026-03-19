import { exercises, getRandomCognitiveTask, getRandomDisruption } from './data.js';

class ExercisePlayer {
  constructor() {
    this.currentExercise = null;
    this.resolvedSteps = null; // Steps with dynamic slots resolved
    this.currentStepIndex = 0;
    this.isPaused = false;
    this.isRunning = false;
    this.phase = 'pre-check'; // pre-check, intention, active, post-check
    this.signalsBefore = {};
    this.signalsAfter = {};
    this.intention = null;
    this.stepTimer = null;
    this.exerciseTimer = null;
    this.totalElapsed = 0;
    this.stepElapsed = 0;
    this.repeatCount = 0;
    this.maxRepeats = 0;
    this.onStateChange = null;
    this.onPhaseChange = null;
    this.onComplete = null;
    this.onStepChange = null;
    this.onStepTick = null;
    this.onTimerTick = null;
    this.breathingState = null;
    this.soundEnabled = true;
    this.audioCtx = null;
  }

  /**
   * Resolve dynamic slots (cognitive-slot, disruption-slot) into concrete steps.
   * Called once at exercise start so the rest of the player logic stays unchanged.
   * @param {Object} exercise - Exercise object with steps array
   * @returns {Array} Resolved steps array
   */
  resolveSteps(exercise) {
    if (!exercise || !exercise.steps) return [];

    const cognitiveTier = exercise.cognitiveTier || 'tier1';

    return exercise.steps.map(step => {
      if (step.type === 'cognitive-slot') {
        const task = getRandomCognitiveTask(cognitiveTier);
        return {
          instruction: task.instruction,
          duration: step.duration || task.duration,
          type: 'cognitive'
        };
      }
      if (step.type === 'disruption-slot') {
        const disruption = getRandomDisruption();
        return {
          instruction: disruption.instruction,
          duration: disruption.duration,
          type: 'disruption'
        };
      }
      return { ...step };
    });
  }

  /**
   * Initialize with exercise ID
   * @param {string} exerciseId - ID of exercise to start
   * @throws {Error} If exercise not found
   */
  start(exerciseId) {
    if (!exerciseId || typeof exerciseId !== 'string') {
      throw new Error('Invalid exercise ID');
    }

    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) {
      throw new Error(`Exercise not found: ${exerciseId}`);
    }

    this.currentExercise = exercise;
    // Resolve dynamic slots (cognitive-slot, disruption-slot) into concrete steps
    this.resolvedSteps = this.resolveSteps(exercise);
    this.phase = 'pre-check';
    this.currentStepIndex = 0;
    this.isPaused = false;
    this.isRunning = false;
    this.signalsBefore = {};
    this.signalsAfter = {};
    this.intention = null;
    this.totalElapsed = 0;
    this.stepElapsed = 0;
    this.repeatCount = 0;
    this.breathingState = null;

    // Initialize audio context if needed
    if (this.soundEnabled) {
      this.initAudio();
    }

    this.notify('phaseChange', { phase: 'pre-check' });
  }

  /**
   * Set pre-check signals (mind, body, breath, pressure ratings 0-2)
   * @param {Object} signals - Signal values before exercise
   */
  setSignalsBefore(signals) {
    if (!signals || typeof signals !== 'object') {
      throw new Error('Signals must be an object');
    }
    this.signalsBefore = { ...signals };
  }

  /**
   * Set intention for the session
   * @param {string} intentionId - ID of selected intention
   */
  setIntention(intentionId) {
    if (intentionId && typeof intentionId !== 'string') {
      throw new Error('Intention ID must be a string');
    }
    this.intention = intentionId || null;
  }

  /**
   * Proceed from pre-check phase
   * Routes to intention phase if training/challenge, or directly to exercise
   */
  proceedFromPreCheck() {
    if (!this.currentExercise) {
      throw new Error('No exercise loaded');
    }

    const mode = this.currentExercise.mode || 'basic';
    if (mode === 'training' || mode === 'challenge' || mode === 'both') {
      this.phase = 'intention';
      this.notify('phaseChange', { phase: 'intention' });
    } else {
      this.beginExercise();
    }
  }

  /**
   * Skip intention phase and go directly to active exercise
   */
  skipIntention() {
    if (this.phase !== 'intention') {
      throw new Error('Can only skip intention from intention phase');
    }
    this.beginExercise();
  }

  /**
   * Move from intention (or pre-check) to active exercise phase
   */
  beginExercise() {
    if (!this.currentExercise) {
      throw new Error('No exercise loaded');
    }

    this.phase = 'active';
    this.isRunning = true;
    this.currentStepIndex = 0;
    this.totalElapsed = 0;
    this.stepElapsed = 0;
    this.repeatCount = 0;

    this.startStep();
    this.startExerciseTimer();
    this.notify('phaseChange', { phase: 'active' });
  }

  /**
   * Start current step timer and setup step-specific state
   */
  startStep() {
    const step = this.getCurrentStep();
    if (!step) {
      this.completeExercise();
      return;
    }

    this.stepElapsed = 0;

    // Determine breathing state based on step type
    if (step.type === 'breathe-in') {
      this.breathingState = 'inhale';
    } else if (step.type === 'breathe-out') {
      this.breathingState = 'exhale';
    } else if (step.type === 'hold' || step.type === 'pressure-hold') {
      this.breathingState = 'hold';
    } else {
      this.breathingState = null;
    }

    // Play audio cue for this step
    if (this.soundEnabled) {
      this.playStepSound(step.type);
    }

    // Notify UI of step change
    this.notify('stepChange', {
      step,
      index: this.currentStepIndex,
      total: this.getStepCount(),
      breathingState: this.breathingState,
    });

    // Special handling for repeat step
    if (step.type === 'repeat') {
      this.handleRepeat();
      return;
    }

    // Start step timer if step has duration
    if (step.duration && step.duration > 0) {
      this.stepTimer = setInterval(() => {
        if (!this.isPaused) {
          this.stepElapsed++;
          this.notify('stepTick', {
            elapsed: this.stepElapsed,
            duration: step.duration,
          });

          if (this.stepElapsed >= step.duration) {
            this.advanceStep();
          }
        }
      }, 1000);
    }
  }

  /**
   * Handle repeat step - loops breathing pattern based on remaining time
   */
  handleRepeat() {
    const remainingTime = this.currentExercise.duration - this.totalElapsed;

    // Stop if less than 5 seconds remaining
    if (remainingTime <= 5) {
      this.completeExercise();
      return;
    }

    // Find the start of the breathing pattern
    // Look for the first 'breathe-in' step before current position
    const steps = this.resolvedSteps || this.currentExercise.steps;
    let patternStart = 0;
    for (let i = this.currentStepIndex - 1; i >= 0; i--) {
      const s = steps[i];
      if (s.type === 'breathe-in') {
        patternStart = i;
        break;
      }
    }

    // If no breathe-in found before, start from beginning
    if (patternStart === this.currentStepIndex) {
      patternStart = 0;
    }

    this.currentStepIndex = patternStart;
    this.repeatCount++;
    this.startStep();
  }

  /**
   * Advance to next step in sequence
   */
  advanceStep() {
    clearInterval(this.stepTimer);
    this.stepTimer = null;
    this.currentStepIndex++;

    const steps = this.resolvedSteps || this.currentExercise.steps;

    // Check if exercise time is up
    if (this.totalElapsed >= this.currentExercise.duration) {
      this.completeExercise();
      return;
    }

    // Check if we've gone through all steps
    if (this.currentStepIndex >= steps.length) {
      this.completeExercise();
      return;
    }

    this.startStep();
  }

  /**
   * Skip current step and move to next
   */
  skipStep() {
    if (this.phase !== 'active' || !this.isRunning) {
      return;
    }

    clearInterval(this.stepTimer);
    this.stepTimer = null;
    this.currentStepIndex++;

    const steps = this.resolvedSteps || this.currentExercise.steps;
    if (this.currentStepIndex >= steps.length) {
      this.completeExercise();
    } else {
      this.startStep();
    }
  }

  /**
   * Pause the exercise (stops timers, preserves state)
   */
  pause() {
    if (!this.isRunning || this.isPaused) {
      return;
    }

    this.isPaused = true;
    clearInterval(this.stepTimer);
    clearInterval(this.exerciseTimer);
    this.notify('stateChange', { isPaused: true });
  }

  /**
   * Resume from paused state
   */
  resume() {
    if (!this.isRunning || !this.isPaused) {
      return;
    }

    this.isPaused = false;

    // Restart current step timer
    const step = this.getCurrentStep();
    if (step && step.duration && step.duration > 0) {
      this.stepTimer = setInterval(() => {
        if (!this.isPaused) {
          this.stepElapsed++;
          this.notify('stepTick', {
            elapsed: this.stepElapsed,
            duration: step.duration,
          });

          if (this.stepElapsed >= step.duration) {
            this.advanceStep();
          }
        }
      }, 1000);
    }

    // Restart exercise timer
    this.startExerciseTimer();
    this.notify('stateChange', { isPaused: false });
  }

  /**
   * Restart exercise from beginning (resets all state)
   */
  restart() {
    if (!this.currentExercise) {
      throw new Error('No exercise loaded');
    }

    clearInterval(this.stepTimer);
    clearInterval(this.exerciseTimer);
    this.stepTimer = null;
    this.exerciseTimer = null;

    // Re-resolve dynamic slots for fresh randomization
    this.resolvedSteps = this.resolveSteps(this.currentExercise);
    this.currentStepIndex = 0;
    this.totalElapsed = 0;
    this.stepElapsed = 0;
    this.repeatCount = 0;
    this.isRunning = true;
    this.isPaused = false;
    this.phase = 'active';

    this.startStep();
    this.startExerciseTimer();
    this.notify('stateChange', { restarted: true });
  }

  /**
   * Start or restart the main exercise timer
   */
  startExerciseTimer() {
    clearInterval(this.exerciseTimer);
    this.exerciseTimer = setInterval(() => {
      if (!this.isPaused) {
        this.totalElapsed++;
        this.notify('timerTick', {
          elapsed: this.totalElapsed,
          duration: this.currentExercise.duration,
          remaining: Math.max(0, this.currentExercise.duration - this.totalElapsed),
        });

        // Auto-complete when duration reached
        if (this.totalElapsed >= this.currentExercise.duration) {
          this.completeExercise();
        }
      }
    }, 1000);
  }

  /**
   * Complete exercise and move to post-check phase
   */
  completeExercise() {
    clearInterval(this.stepTimer);
    clearInterval(this.exerciseTimer);
    this.stepTimer = null;
    this.exerciseTimer = null;

    this.isRunning = false;
    this.phase = 'post-check';
    this.breathingState = null;

    this.notify('phaseChange', { phase: 'post-check' });
    if (this.onComplete) {
      this.onComplete();
    }
  }

  /**
   * Set post-check signals (after exercise)
   * @param {Object} signals - Signal values after exercise
   */
  setSignalsAfter(signals) {
    if (!signals || typeof signals !== 'object') {
      throw new Error('Signals must be an object');
    }
    this.signalsAfter = { ...signals };
  }

  /**
   * Get session data for storage/tracking
   * @returns {Object} Session data object
   */
  getSessionData() {
    if (!this.currentExercise) {
      throw new Error('No exercise loaded');
    }

    return {
      exerciseId: this.currentExercise.id,
      exerciseName: this.currentExercise.title,
      mode: this.currentExercise.mode,
      date: new Date().toISOString().split('T')[0],
      duration: this.currentExercise.duration,
      completed: this.phase === 'post-check',
      signalsBefore: { ...this.signalsBefore },
      signalsAfter: { ...this.signalsAfter },
      intention: this.intention,
      repeatCount: this.repeatCount,
      totalElapsed: this.totalElapsed,
      timestamp: Date.now(),
    };
  }

  /**
   * Get current step object
   * @returns {Object|null} Current step or null if none
   */
  getCurrentStep() {
    const steps = this.resolvedSteps || (this.currentExercise && this.currentExercise.steps);
    if (!steps) {
      return null;
    }
    return steps[this.currentStepIndex] || null;
  }

  /**
   * Get count of non-repeat steps in exercise
   * @returns {number} Count of active steps
   */
  getStepCount() {
    const steps = this.resolvedSteps || (this.currentExercise && this.currentExercise.steps);
    if (!steps) {
      return 0;
    }
    return steps.filter(s => s.type !== 'repeat').length;
  }

  /**
   * Initialize Web Audio API context for sound cues
   */
  initAudio() {
    if (this.audioCtx) {
      return; // Already initialized
    }

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (err) {
      // Audio context not available, silently continue
      this.audioCtx = null;
    }
  }

  /**
   * Play a gentle audio cue for step type
   * @param {string} stepType - Type of step (breathe-in, breathe-out, hold, etc.)
   */
  playStepSound(stepType) {
    if (!this.audioCtx || !this.soundEnabled) {
      return;
    }

    try {
      // Resume audio context if suspended (common in browsers)
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {
          // Ignore resume errors
        });
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      const duration = 0.35;
      const fadeOutTime = 0.3;

      gain.gain.setValueAtTime(0.08, now); // Very gentle volume

      // Set frequency and waveform based on step type
      switch (stepType) {
        case 'breathe-in':
          osc.frequency.setValueAtTime(396, now); // Soothing low tone
          osc.type = 'sine';
          break;
        case 'breathe-out':
          osc.frequency.setValueAtTime(320, now); // Slightly lower tone
          osc.type = 'sine';
          break;
        case 'hold':
        case 'pressure-hold':
          osc.frequency.setValueAtTime(350, now); // Middle tone
          osc.type = 'sine';
          break;
        case 'disruption':
          osc.frequency.setValueAtTime(480, now); // Higher alert tone
          osc.type = 'triangle';
          gain.gain.setValueAtTime(0.12, now); // Slightly louder for alerts
          break;
        default:
          // No sound for prompt, timed, cognitive, repeat
          osc.stop(now);
          return;
      }

      // Exponential fade out
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        now + fadeOutTime
      );

      osc.start(now);
      osc.stop(now + duration);
    } catch (err) {
      // Ignore audio playback errors
    }
  }

  /**
   * Set sound enabled state
   * @param {boolean} enabled - Whether sound cues should play
   */
  setSoundEnabled(enabled) {
    this.soundEnabled = !!enabled;
  }

  /**
   * Emit notification to registered callbacks
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  notify(event, data) {
    const callbacks = {
      stateChange: this.onStateChange,
      phaseChange: this.onPhaseChange,
      stepChange: this.onStepChange,
      stepTick: this.onStepTick,
      timerTick: this.onTimerTick,
      complete: this.onComplete,
    };

    const callback = callbacks[event];
    if (callback && typeof callback === 'function') {
      try {
        callback(data);
      } catch (err) {
        // Prevent callback errors from crashing the player
        console.error(`Error in ${event} callback:`, err);
      }
    }
  }

  /**
   * Clean up all timers and resources
   * Call this when destroying the player instance
   */
  destroy() {
    clearInterval(this.stepTimer);
    clearInterval(this.exerciseTimer);
    this.stepTimer = null;
    this.exerciseTimer = null;

    this.isRunning = false;
    this.isPaused = false;

    // Clean up audio context
    if (this.audioCtx) {
      try {
        if (this.audioCtx.state !== 'closed') {
          this.audioCtx.close();
        }
      } catch (err) {
        // Ignore close errors
      }
      this.audioCtx = null;
    }

    // Clear callbacks to prevent memory leaks
    this.onStateChange = null;
    this.onPhaseChange = null;
    this.onComplete = null;
    this.onStepChange = null;
    this.onStepTick = null;
    this.onTimerTick = null;
  }
}

/**
 * Format seconds as M:SS display string
 * @param {number} seconds - Total seconds to format
 * @returns {string} Formatted time string
 */
function formatTime(seconds) {
  if (typeof seconds !== 'number' || seconds < 0) {
    return '0:00';
  }

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export { ExercisePlayer, formatTime };
