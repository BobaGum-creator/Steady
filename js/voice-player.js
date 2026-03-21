/**
 * Steady - Voice Player
 * Handles loading and playing voice audio clips during exercises.
 *
 * Features:
 * - Plays one clip at a time (auto-cancels previous if overlapping)
 * - Preloads the next step's clip for gapless playback
 * - Graceful fallback: missing files produce silence, not errors
 * - Respects pause/resume state
 * - Singleton pattern — one instance shared across the app
 *
 * @module voice-player
 */

import { resolveClipPath, DEFAULT_VOICE } from './voice-config.js';

class VoicePlayer {
  constructor() {
    /** @type {HTMLAudioElement|null} Currently playing audio element */
    this._current = null;

    /** @type {Map<string, HTMLAudioElement>} Preloaded clips cache */
    this._cache = new Map();

    /** @type {string} Active voice ID */
    this._voiceId = DEFAULT_VOICE;

    /** @type {boolean} Whether voice playback is enabled */
    this._enabled = true;

    /** @type {number} Playback volume (0-1) */
    this._volume = 0.85;

    /** @type {boolean} Whether currently paused */
    this._paused = false;
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Play the voice clip for a given step.
   * Cancels any currently playing clip first.
   *
   * @param {Object} step - Step object { instruction, type, duration }
   * @returns {Promise<boolean>} Whether a clip was played (false if no clip or disabled)
   */
  async play(step) {
    if (!this._enabled || !step) return false;

    const path = resolveClipPath(step, this._voiceId);
    if (!path) return false;

    // Stop any currently playing clip
    this.stop();

    try {
      const audio = await this._getAudio(path);
      audio.volume = this._volume;
      audio.currentTime = 0;
      this._current = audio;

      if (!this._paused) {
        await audio.play();
      }
      return true;
    } catch (err) {
      // Missing file, network error, autoplay blocked — all silent failures
      console.warn('[Voice] Clip not available:', path, err.message);
      this._current = null;
      return false;
    }
  }

  /**
   * Preload the clip for an upcoming step so it plays instantly when needed.
   * Call this during the current step to warm the cache for the next step.
   *
   * @param {Object} step - Next step object { instruction, type }
   */
  preload(step) {
    if (!this._enabled || !step) return;

    const path = resolveClipPath(step, this._voiceId);
    if (!path || this._cache.has(path)) return;

    // Create audio element and start loading
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = path;

    // Cache on successful load, discard on error
    audio.addEventListener('canplaythrough', () => {
      this._cache.set(path, audio);
    }, { once: true });

    audio.addEventListener('error', () => {
      // File doesn't exist yet — that's fine, we'll try again when clips are added
    }, { once: true });

    // Kick off the load
    audio.load();
  }

  /**
   * Stop the currently playing clip immediately.
   */
  stop() {
    if (this._current) {
      try {
        this._current.pause();
        this._current.currentTime = 0;
      } catch (_) {
        // Ignore — element may already be disposed
      }
      this._current = null;
    }
  }

  /**
   * Pause the currently playing clip (if any).
   * Called when the exercise is paused.
   */
  pause() {
    this._paused = true;
    if (this._current) {
      try {
        this._current.pause();
      } catch (_) {}
    }
  }

  /**
   * Resume the currently paused clip (if any).
   * Called when the exercise is resumed.
   */
  resume() {
    this._paused = false;
    if (this._current && this._current.paused && this._current.currentTime > 0) {
      try {
        this._current.play().catch(() => {});
      } catch (_) {}
    }
  }

  /**
   * Enable or disable voice playback.
   * When disabled, all play() calls are no-ops.
   *
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this._enabled = !!enabled;
    if (!this._enabled) {
      this.stop();
    }
  }

  /**
   * @returns {boolean} Whether voice is currently enabled
   */
  isEnabled() {
    return this._enabled;
  }

  /**
   * Set the active voice.
   * Clears the clip cache since paths change with voice.
   *
   * @param {string} voiceId - Voice ID from voice-config (e.g. 'john', 'jane')
   */
  setVoice(voiceId) {
    if (voiceId === this._voiceId) return;
    this._voiceId = voiceId;
    this.clearCache();
  }

  /**
   * @returns {string} The current voice ID
   */
  getVoice() {
    return this._voiceId;
  }

  /**
   * Set playback volume.
   * @param {number} vol - Volume from 0 to 1
   */
  setVolume(vol) {
    this._volume = Math.max(0, Math.min(1, vol));
    if (this._current) {
      this._current.volume = this._volume;
    }
  }

  /**
   * Clear the preload cache. Call when switching voices or cleaning up.
   */
  clearCache() {
    this.stop();
    this._cache.forEach((audio) => {
      try {
        audio.src = '';
        audio.load();
      } catch (_) {}
    });
    this._cache.clear();
  }

  /**
   * Full cleanup. Call when destroying the exercise player.
   */
  destroy() {
    this.stop();
    this.clearCache();
  }

  // ==========================================================================
  // PRIVATE
  // ==========================================================================

  /**
   * Get an audio element for a path — from cache or create new.
   * @param {string} path
   * @returns {Promise<HTMLAudioElement>}
   */
  _getAudio(path) {
    return new Promise((resolve, reject) => {
      // Check cache first
      if (this._cache.has(path)) {
        resolve(this._cache.get(path));
        return;
      }

      // Create and load
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = path;

      audio.addEventListener('canplaythrough', () => {
        this._cache.set(path, audio);
        resolve(audio);
      }, { once: true });

      audio.addEventListener('error', () => {
        reject(new Error(`Failed to load: ${path}`));
      }, { once: true });

      audio.load();
    });
  }
}

// Singleton instance — shared across the app
const voicePlayer = new VoicePlayer();

export default voicePlayer;
export { VoicePlayer };
