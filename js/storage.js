/**
 * Storage module for Steady — dual-layer persistence
 *
 * Reads/writes synchronously via localStorage for instant UI response,
 * and writes through to IndexedDB asynchronously for durability and
 * larger storage quota. On startup, hydrateFromIDB restores any data
 * that may have been lost from localStorage (e.g. browser cleared storage
 * but IndexedDB survived, or vice versa).
 *
 * All localStorage keys use the "steady_" prefix for namespacing.
 */

import * as idb from './idb.js';

const PREFIX = 'steady_';

// Track whether IDB is ready (non-blocking)
let idbReady = false;

/**
 * Initializes the storage layer:
 * 1. Hydrates localStorage from IndexedDB (restores lost data)
 * 2. Syncs any localStorage-only data into IndexedDB (initial migration)
 * Call this once at app startup. Returns a promise but app can proceed
 * without waiting — localStorage is always available synchronously.
 * @returns {Promise<void>}
 */
export async function init() {
  try {
    const available = await idb.isAvailable();
    if (!available) {
      console.warn('IndexedDB not available — using localStorage only');
      return;
    }

    // First: hydrate localStorage from IDB (restore any lost data)
    const hydrated = await idb.hydrateFromIDB(PREFIX);
    if (hydrated > 0) {
      console.log(`Hydrated ${hydrated} keys from IndexedDB`);
    }

    // Then: sync any localStorage-only data into IDB (initial migration)
    const synced = await idb.syncToIDB(PREFIX);
    if (synced > 0) {
      console.log(`Synced ${synced} keys to IndexedDB`);
    }

    idbReady = true;
  } catch (err) {
    console.warn('Storage init error:', err.message);
  }
}

/**
 * Wraps localStorage operations with error handling for quota exceeded
 * @param {Function} operation - Function that performs the storage operation
 * @returns {any} Result of the operation
 * @throws {Error} If storage quota exceeded or other storage error
 */
function withStorageErrorHandling(operation) {
  try {
    return operation();
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      throw new Error('Storage quota exceeded. Please clear some data.');
    }
    if (error.name === 'SecurityError') {
      throw new Error('Storage access denied. Check privacy settings.');
    }
    throw error;
  }
}

/**
 * Fire-and-forget write to IndexedDB. Never throws.
 * @param {string} store - IDB store name
 * @param {string} key - Record key
 * @param {any} value - Value to persist
 */
function idbPut(store, key, value) {
  if (!idbReady) return;
  idb.put(store, key, value).catch(() => {});
}

/**
 * Fire-and-forget delete from IndexedDB. Never throws.
 * @param {string} store - IDB store name
 * @param {string} key - Record key
 */
function idbRemove(store, key) {
  if (!idbReady) return;
  idb.remove(store, key).catch(() => {});
}

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Gets today's date in YYYY-MM-DD format
 * @returns {string} Today's date
 */
export function getToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates days elapsed since a given date
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {number} Number of days elapsed
 */
export function getDaysSince(dateString) {
  const past = new Date(dateString);
  const today = new Date();
  const diffTime = today - past;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Gets the date string for N days ago
 * @param {number} days - Number of days back
 * @returns {string} Date in YYYY-MM-DD format
 */
function getDateNDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ============================================================================
// SETTINGS
// ============================================================================

const DEFAULT_SETTINGS = {
  sound: true,
  reducedMotion: false,
  theme: 'dark',
  reminderEnabled: false,
  reminderTime: '09:00',
};

/**
 * Gets all user settings
 * @returns {Object} Settings object
 */
export function getSettings() {
  return withStorageErrorHandling(() => {
    const stored = localStorage.getItem(`${PREFIX}settings`);
    if (!stored) {
      return { ...DEFAULT_SETTINGS };
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  });
}

/**
 * Saves user settings
 * @param {Object} settings - Settings object to save
 */
export function saveSettings(settings) {
  return withStorageErrorHandling(() => {
    const merged = { ...getSettings(), ...settings };
    localStorage.setItem(`${PREFIX}settings`, JSON.stringify(merged));
    idbPut('settings', 'settings', merged);
  });
}

// ============================================================================
// CHECK-INS (Daily Stress Ratings)
// ============================================================================

/**
 * Valid signal IDs for the 4-signal state check system (V4)
 */
const VALID_SIGNALS = ['mind', 'body', 'breath', 'pressure'];

/**
 * Saves a check-in for today (V4: primary signal instead of numeric level)
 * @param {string} primarySignal - Which signal feels strongest: 'mind' | 'body' | 'breath' | 'pressure'
 */
export function saveCheckIn(primarySignal) {
  return withStorageErrorHandling(() => {
    if (!VALID_SIGNALS.includes(primarySignal)) {
      throw new Error('Check-in signal must be one of: ' + VALID_SIGNALS.join(', '));
    }
    const today = getToday();
    const checkIn = {
      primarySignal,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${PREFIX}checkin_${today}`, JSON.stringify(checkIn));
    idbPut('checkins', today, checkIn);
  });
}

/**
 * Gets today's check-in
 * @returns {Object|null} Check-in object or null if none exists
 */
export function getTodayCheckIn() {
  return withStorageErrorHandling(() => {
    const today = getToday();
    const stored = localStorage.getItem(`${PREFIX}checkin_${today}`);
    return stored ? JSON.parse(stored) : null;
  });
}

/**
 * Gets check-ins for the last N days
 * @param {number} days - Number of days to retrieve (default: 30)
 * @returns {Array} Array of check-in objects with date property
 */
export function getCheckIns(days = 30) {
  return withStorageErrorHandling(() => {
    const checkIns = [];
    for (let i = 0; i < days; i++) {
      const date = getDateNDaysAgo(i);
      const stored = localStorage.getItem(`${PREFIX}checkin_${date}`);
      if (stored) {
        const checkIn = JSON.parse(stored);
        checkIns.push({
          date,
          level: checkIn.level,
          timestamp: checkIn.timestamp,
        });
      }
    }
    return checkIns.reverse(); // oldest first
  });
}

// ============================================================================
// EXERCISE SESSIONS
// ============================================================================

/**
 * Sums signal levels into a single number for backward compatibility
 * @param {Object} signals - { mind, body, breath, pressure } each 0-2
 * @returns {number} Sum 0-8
 */
function sumSignals(signals) {
  return (signals.mind || 0) + (signals.body || 0) + (signals.breath || 0) + (signals.pressure || 0);
}

/**
 * Saves an exercise session (V4: signal-based before/after)
 * @param {string} exerciseId - ID of the exercise
 * @param {Object} data - Session data: { signalsBefore, signalsAfter, completed, duration }
 *   signalsBefore/signalsAfter: { mind: 0-2, body: 0-2, breath: 0-2, pressure: 0-2 }
 */
export function saveSession(exerciseId, data) {
  return withStorageErrorHandling(() => {
    if (!exerciseId) {
      throw new Error('Exercise ID is required');
    }
    if (typeof data.duration !== 'number' || data.duration < 0) {
      throw new Error('duration must be a non-negative number');
    }

    const timestamp = Date.now();
    const date = getToday();

    // V4: signal-based data with backward-compatible summary fields
    const session = {
      exerciseId,
      stressBefore: data.signalsBefore ? sumSignals(data.signalsBefore) : (data.stressBefore || 0),
      stressAfter: data.signalsAfter ? sumSignals(data.signalsAfter) : (data.stressAfter || 0),
      signalsBefore: data.signalsBefore || null,
      signalsAfter: data.signalsAfter || null,
      completed: data.completed === true,
      duration: data.duration,
      timestamp,
      date,
    };

    const key = `${PREFIX}session_${timestamp}`;
    localStorage.setItem(key, JSON.stringify(session));
    idbPut('sessions', String(timestamp), session);
  });
}

/**
 * Gets all sessions from today
 * @returns {Array} Array of session objects
 */
export function getTodaySessions() {
  return withStorageErrorHandling(() => {
    const today = getToday();
    const sessions = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${PREFIX}session_`)) {
        const session = JSON.parse(localStorage.getItem(key));
        if (session.date === today) {
          sessions.push(session);
        }
      }
    }
    return sessions.sort((a, b) => a.timestamp - b.timestamp);
  });
}

/**
 * Gets all sessions from the last N days
 * @param {number} days - Number of days to retrieve (default: 30)
 * @returns {Array} Array of session objects sorted by timestamp
 */
export function getRecentSessions(days = 30) {
  return withStorageErrorHandling(() => {
    const cutoffDate = getDateNDaysAgo(days);
    const sessions = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${PREFIX}session_`)) {
        const session = JSON.parse(localStorage.getItem(key));
        if (session.date >= cutoffDate) {
          sessions.push(session);
        }
      }
    }
    return sessions.sort((a, b) => a.timestamp - b.timestamp);
  });
}

/**
 * Gets the most used exercises with stress reduction metrics
 * @param {number} days - Number of days to analyze (default: 30)
 * @returns {Array} Sorted array of { exerciseId, count, avgStressReduction }
 */
export function getMostUsedExercises(days = 30) {
  return withStorageErrorHandling(() => {
    const sessions = getRecentSessions(days);
    const exerciseMap = new Map();

    sessions.forEach((session) => {
      if (!exerciseMap.has(session.exerciseId)) {
        exerciseMap.set(session.exerciseId, {
          exerciseId: session.exerciseId,
          count: 0,
          totalReduction: 0,
          reductionCount: 0,
        });
      }

      const entry = exerciseMap.get(session.exerciseId);
      entry.count += 1;

      // V4+: compute total signal drop across all signals
      if (session.signalsBefore && session.signalsAfter) {
        let totalDrop = 0;
        for (const sig of ['mind', 'body', 'breath', 'pressure']) {
          const before = session.signalsBefore[sig] || 0;
          const after = session.signalsAfter[sig] || 0;
          totalDrop += Math.max(0, before - after);
        }
        entry.totalReduction += totalDrop;
        entry.reductionCount += 1;
      } else if (typeof session.stressBefore === 'number' && typeof session.stressAfter === 'number') {
        // Legacy fallback
        entry.totalReduction += session.stressBefore - session.stressAfter;
        entry.reductionCount += 1;
      }
    });

    return Array.from(exerciseMap.values())
      .map((entry) => ({
        exerciseId: entry.exerciseId,
        count: entry.count,
        avgReduction: entry.reductionCount > 0 ? entry.totalReduction / entry.reductionCount : 0,
      }))
      .sort((a, b) => b.count - a.count);
  });
}

/**
 * Calculates current and longest streaks from completed sessions
 * A streak is consecutive days with at least one completed session
 * @returns {Object} { current, longest, lastActiveDate }
 */
export function getStreak() {
  return withStorageErrorHandling(() => {
    const sessions = getRecentSessions(365); // Look back up to a year
    const activeDates = new Set();

    // Collect all dates with completed sessions
    sessions.forEach((session) => {
      if (session.completed) {
        activeDates.add(session.date);
      }
    });

    if (activeDates.size === 0) {
      return {
        current: 0,
        longest: 0,
        lastActiveDate: null,
      };
    }

    // Sort dates in descending order to work backward from today
    const sortedDates = Array.from(activeDates).sort().reverse();
    const today = getToday();
    let currentStreak = 0;
    let longestStreak = 0;
    let lastActiveDate = null;

    // Calculate current streak from today backward
    let checkDate = today;
    while (activeDates.has(checkDate)) {
      currentStreak += 1;
      lastActiveDate = checkDate;
      const dateObj = new Date(checkDate);
      dateObj.setDate(dateObj.getDate() - 1);
      checkDate = dateObj.toISOString().split('T')[0];
    }

    // Calculate longest streak by scanning through sorted dates
    let tempStreak = 0;
    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = sortedDates[i];
      tempStreak += 1;

      // Check if next date (in chronological order, so previous in reverse)
      if (i + 1 < sortedDates.length) {
        const nextDate = sortedDates[i + 1];
        const daysDiff = getDaysSince(nextDate) - getDaysSince(currentDate);
        if (daysDiff !== 1) {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 0;
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
      }
    }

    return {
      current: currentStreak,
      longest: longestStreak,
      lastActiveDate,
    };
  });
}

// ============================================================================
// JOURNAL ENTRIES
// ============================================================================

/**
 * Saves a journal entry
 * @param {Object} entry - Journal entry: { stressor, inControl, nextStep }
 */
export function saveJournalEntry(entry) {
  return withStorageErrorHandling(() => {
    if (!entry.stressor || typeof entry.stressor !== 'string') {
      throw new Error('stressor field is required and must be a string');
    }
    if (!entry.inControl || (typeof entry.inControl !== 'string' && typeof entry.inControl !== 'number')) {
      throw new Error('inControl field is required');
    }
    if (!entry.nextStep || typeof entry.nextStep !== 'string') {
      throw new Error('nextStep field is required and must be a string');
    }

    const timestamp = Date.now();
    const journalEntry = {
      ...entry,
      timestamp,
      date: getToday(),
    };

    const key = `${PREFIX}journal_${timestamp}`;
    localStorage.setItem(key, JSON.stringify(journalEntry));
    idbPut('journal', String(timestamp), journalEntry);
  });
}

/**
 * Gets journal entries from the last N days
 * @param {number} days - Number of days to retrieve (default: 30)
 * @returns {Array} Array of journal entries sorted by date descending
 */
export function getJournalEntries(days = 30) {
  return withStorageErrorHandling(() => {
    const cutoffDate = getDateNDaysAgo(days);
    const entries = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${PREFIX}journal_`)) {
        const entry = JSON.parse(localStorage.getItem(key));
        if (entry.date >= cutoffDate) {
          entries.push(entry);
        }
      }
    }
    return entries.sort((a, b) => b.timestamp - a.timestamp);
  });
}

// ============================================================================
// ONBOARDING PROFILE
// ============================================================================

const DEFAULT_PROFILE = {
  completed: false,
  primaryStressors: [],   // e.g. ['work', 'sleep', 'anxiety', 'body-tension']
  preferredModalities: [], // e.g. ['breathwork', 'body', 'mind', 'quick']
  availableMinutes: 3,     // typical time they have: 1, 3, 5, 10
  goals: [],               // e.g. ['calm-down', 'build-resilience', 'sleep-better']
};

/**
 * Gets the user's onboarding profile
 * @returns {Object} Profile object
 */
export function getProfile() {
  return withStorageErrorHandling(() => {
    const stored = localStorage.getItem(`${PREFIX}profile`);
    if (!stored) return { ...DEFAULT_PROFILE };
    return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
  });
}

/**
 * Saves the user's onboarding profile
 * @param {Object} profile - Profile object
 */
export function saveProfile(profile) {
  return withStorageErrorHandling(() => {
    const merged = { ...getProfile(), ...profile, completed: true };
    localStorage.setItem(`${PREFIX}profile`, JSON.stringify(merged));
    idbPut('settings', 'profile', merged);
  });
}

/**
 * Check if onboarding has been completed
 * @returns {boolean}
 */
export function hasCompletedOnboarding() {
  return getProfile().completed;
}

// ============================================================================
// EXERCISE EFFECTIVENESS (outcome-based learning)
// ============================================================================

/**
 * Calculates per-exercise effectiveness scores from session history.
 * Returns exercises ranked by average stress reduction for this user.
 * @param {number} days - Days of history to analyze (default: 90)
 * @returns {Map<string, {count: number, avgReduction: number, consistency: number}>}
 */
export function getExerciseEffectiveness(days = 90) {
  return withStorageErrorHandling(() => {
    const sessions = getRecentSessions(days);
    const map = new Map();

    sessions.forEach(s => {
      if (typeof s.stressBefore !== 'number' || typeof s.stressAfter !== 'number') return;
      if (!s.completed) return;

      const reduction = s.stressBefore - s.stressAfter;
      if (!map.has(s.exerciseId)) {
        map.set(s.exerciseId, { count: 0, totalReduction: 0, reductions: [] });
      }
      const entry = map.get(s.exerciseId);
      entry.count++;
      entry.totalReduction += reduction;
      entry.reductions.push(reduction);
    });

    // Compute avg and consistency (lower variance = more consistent)
    const result = new Map();
    map.forEach((entry, id) => {
      const avg = entry.totalReduction / entry.count;
      // Consistency: what % of sessions produced positive reduction
      const positiveRate = entry.reductions.filter(r => r > 0).length / entry.count;
      result.set(id, {
        count: entry.count,
        avgReduction: avg,
        consistency: positiveRate,
      });
    });

    return result;
  });
}

// ============================================================================
// SIGNAL EFFECTIVENESS (V4 — per-exercise, per-signal reduction tracking)
// ============================================================================

/**
 * Calculates per-exercise, per-signal reduction data from V4 sessions.
 * @param {number} days - Days of history to analyze (default: 90)
 * @returns {Map<string, {count: number, mind: number, body: number, breath: number, pressure: number}>}
 *   Values are average reduction per signal (0-2 scale).
 */
export function getSignalEffectiveness(days = 90) {
  return withStorageErrorHandling(() => {
    const sessions = getRecentSessions(days);
    const map = new Map();

    sessions.forEach(s => {
      if (!s.signalsBefore || !s.signalsAfter || !s.completed) return;
      if (!map.has(s.exerciseId)) {
        map.set(s.exerciseId, { count: 0, mind: 0, body: 0, breath: 0, pressure: 0 });
      }
      const entry = map.get(s.exerciseId);
      entry.count++;
      ['mind', 'body', 'breath', 'pressure'].forEach(sig => {
        entry[sig] += (s.signalsBefore[sig] || 0) - (s.signalsAfter[sig] || 0);
      });
    });

    // Compute averages
    const result = new Map();
    map.forEach((entry, id) => {
      result.set(id, {
        count: entry.count,
        mind: entry.mind / entry.count,
        body: entry.body / entry.count,
        breath: entry.breath / entry.count,
        pressure: entry.pressure / entry.count,
      });
    });
    return result;
  });
}

// ============================================================================
// CHECK-IN HISTORY (V5 — for insight engine)
// ============================================================================

/**
 * Gets check-in history for the last N days with V4 data shape
 * @param {number} days - Number of days to retrieve (default: 14)
 * @returns {Array} Array of { date, primarySignal, timestamp } sorted oldest-first
 */
export function getCheckInHistory(days = 14) {
  return withStorageErrorHandling(() => {
    const checkIns = [];
    for (let i = 0; i < days; i++) {
      const date = getDateNDaysAgo(i);
      const stored = localStorage.getItem(`${PREFIX}checkin_${date}`);
      if (stored) {
        const checkIn = JSON.parse(stored);
        // Support both V4 (primarySignal) and V3 (level) data
        if (checkIn.primarySignal) {
          checkIns.push({
            date,
            primarySignal: checkIn.primarySignal,
            timestamp: checkIn.timestamp,
          });
        }
      }
    }
    return checkIns.reverse(); // oldest first
  });
}

// ============================================================================
// DISMISSED INSIGHTS (V5 — tracks which insight cards the user dismissed)
// ============================================================================

/**
 * Gets all dismissed insights with their expiry timestamps
 * @returns {Object} Map of insightId → expiryTimestamp
 */
export function getDismissedInsights() {
  return withStorageErrorHandling(() => {
    const stored = localStorage.getItem(`${PREFIX}dismissed_insights`);
    if (!stored) return {};
    const dismissed = JSON.parse(stored);
    // Clean expired dismissals (older than 7 days)
    const now = Date.now();
    const cleaned = {};
    let changed = false;
    Object.keys(dismissed).forEach(id => {
      if (dismissed[id] > now) {
        cleaned[id] = dismissed[id];
      } else {
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem(`${PREFIX}dismissed_insights`, JSON.stringify(cleaned));
      idbPut('settings', 'dismissed_insights', cleaned);
    }
    return cleaned;
  });
}

/**
 * Dismisses an insight card for 7 days
 * @param {string} insightId - The insight ID to dismiss
 */
export function dismissInsight(insightId) {
  return withStorageErrorHandling(() => {
    const dismissed = getDismissedInsights();
    dismissed[insightId] = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
    localStorage.setItem(`${PREFIX}dismissed_insights`, JSON.stringify(dismissed));
    idbPut('settings', 'dismissed_insights', dismissed);
  });
}

/**
 * Gets or sets the weekly summary dismissal state
 * @param {string} weekOf - ISO week string (e.g. '2026-W11')
 * @returns {boolean} Whether the summary for this week has been dismissed
 */
export function isWeeklySummaryDismissed(weekOf) {
  return withStorageErrorHandling(() => {
    const stored = localStorage.getItem(`${PREFIX}weekly_summary_dismissed`);
    return stored === weekOf;
  });
}

/**
 * Dismisses the weekly summary for a given week
 * @param {string} weekOf - ISO week string
 */
export function dismissWeeklySummary(weekOf) {
  return withStorageErrorHandling(() => {
    localStorage.setItem(`${PREFIX}weekly_summary_dismissed`, weekOf);
    idbPut('settings', 'weekly_summary_dismissed', weekOf);
  });
}

// ============================================================================
// FAVORITES
// ============================================================================

/**
 * Gets the list of favorited exercise IDs
 * @returns {Array<string>} Array of exercise IDs
 */
export function getFavorites() {
  return withStorageErrorHandling(() => {
    const stored = localStorage.getItem(`${PREFIX}favorites`);
    return stored ? JSON.parse(stored) : [];
  });
}

/**
 * Toggles an exercise as favorite/unfavorite
 * @param {string} exerciseId - Exercise ID to toggle
 * @returns {boolean} Whether it is now favorited
 */
export function toggleFavorite(exerciseId) {
  return withStorageErrorHandling(() => {
    const favorites = getFavorites();
    const index = favorites.indexOf(exerciseId);
    if (index === -1) {
      favorites.push(exerciseId);
    } else {
      favorites.splice(index, 1);
    }
    localStorage.setItem(`${PREFIX}favorites`, JSON.stringify(favorites));
    idbPut('favorites', 'favorites', favorites);
    return index === -1; // true if now favorited
  });
}

/**
 * Check if an exercise is favorited
 * @param {string} exerciseId - Exercise ID to check
 * @returns {boolean}
 */
export function isFavorite(exerciseId) {
  return getFavorites().includes(exerciseId);
}

// ============================================================================
// V6: DAILY PRACTICE SYSTEM
// ============================================================================

/**
 * Get today's daily practice completion status
 * @returns {{ completed: boolean, exerciseId: string|null, timestamp: number|null }}
 */
export function getTodayPractice() {
  return withStorageErrorHandling(() => {
    const today = getToday();
    const stored = localStorage.getItem(`${PREFIX}practice_${today}`);
    if (!stored) return { completed: false, exerciseId: null, timestamp: null };
    return JSON.parse(stored);
  });
}

/**
 * Mark today's daily practice as completed
 * @param {string} exerciseId - The exercise that was completed as practice
 */
export function completePractice(exerciseId) {
  return withStorageErrorHandling(() => {
    const today = getToday();
    const data = { completed: true, exerciseId, timestamp: Date.now() };
    const key = `${PREFIX}practice_${today}`;
    localStorage.setItem(key, JSON.stringify(data));
    idbPut('practice', today, data);
  });
}

/**
 * Get practice streak (consecutive days with a completed practice)
 * Different from session streak — this only counts daily practice completions
 * @returns {{ current: number, longest: number }}
 */
export function getPracticeStreak() {
  return withStorageErrorHandling(() => {
    const today = getToday();
    let current = 0;
    let longest = 0;
    let checkDate = today;

    // Count backward from today
    while (true) {
      const stored = localStorage.getItem(`${PREFIX}practice_${checkDate}`);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.completed) {
          current++;
          // Move to previous day
          const d = new Date(checkDate + 'T12:00:00');
          d.setDate(d.getDate() - 1);
          checkDate = d.toISOString().split('T')[0];
          continue;
        }
      }
      break;
    }

    // Check if today hasn't been completed yet but yesterday was (streak is still alive)
    if (current === 0) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const stored = localStorage.getItem(`${PREFIX}practice_${yesterdayStr}`);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.completed) {
          // Streak is alive but today's practice is pending
          // Don't count yesterday in current (it'll show as "continue your streak")
        }
      }
    }

    longest = Math.max(current, longest);
    return { current, longest };
  });
}

/**
 * Get the exercise IDs completed as daily practice in the last N days
 * Used to avoid repeating the same practice too soon
 * @param {number} days - How many days to look back
 * @returns {string[]} Array of exercise IDs
 */
export function getRecentPracticeIds(days = 7) {
  return withStorageErrorHandling(() => {
    const ids = [];
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const stored = localStorage.getItem(`${PREFIX}practice_${dateStr}`);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.exerciseId) ids.push(data.exerciseId);
      }
    }
    return ids;
  });
}

// ============================================================================
// DATA EXPORT/IMPORT
// ============================================================================

/**
 * Exports all Steady data as JSON
 * @returns {string} JSON string of all steady_ prefixed data
 */
export function exportAllData() {
  return withStorageErrorHandling(() => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) {
        const cleanKey = key.substring(PREFIX.length);
        data[cleanKey] = JSON.parse(localStorage.getItem(key));
      }
    }
    return JSON.stringify(data, null, 2);
  });
}

/**
 * Imports data from exported JSON
 * @param {string} jsonString - JSON string of data to import
 * @returns {Object} { success: boolean, error?: string }
 */
export function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (typeof data !== 'object' || data === null) {
      return {
        success: false,
        error: 'Invalid JSON: must be an object',
      };
    }

    // Validate structure before importing
    Object.keys(data).forEach((key) => {
      if (typeof data[key] !== 'object' || data[key] === null) {
        throw new Error(`Invalid value for key "${key}": must be an object`);
      }
    });

    // Import validated data to localStorage
    return withStorageErrorHandling(() => {
      Object.keys(data).forEach((key) => {
        localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(data[key]));
      });

      // Also sync imported data to IndexedDB
      if (idbReady) {
        idb.syncToIDB(PREFIX).catch(() => {});
      }

      return { success: true };
    });
  } catch (error) {
    if (error.message && error.message.includes('Invalid')) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'Failed to parse JSON or import data',
    };
  }
}

/**
 * Clears all Steady data from localStorage and IndexedDB
 */
export function clearAllData() {
  return withStorageErrorHandling(() => {
    const keysToDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => localStorage.removeItem(key));

    // Also clear IndexedDB
    if (idbReady) {
      idb.clearAll().catch(() => {});
    }
  });
}
