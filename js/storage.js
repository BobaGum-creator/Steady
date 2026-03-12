/**
 * Storage module for Steady - localStorage abstraction layer
 * All data is stored with "steady_" prefix for namespacing
 */

const PREFIX = 'steady_';

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
  });
}

// ============================================================================
// CHECK-INS (Daily Stress Ratings)
// ============================================================================

/**
 * Saves a check-in (stress rating) for today
 * @param {number} level - Stress level 1-10
 */
export function saveCheckIn(level) {
  return withStorageErrorHandling(() => {
    if (!Number.isInteger(level) || level < 1 || level > 10) {
      throw new Error('Check-in level must be an integer between 1 and 10');
    }
    const today = getToday();
    const checkIn = {
      level,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${PREFIX}checkin_${today}`, JSON.stringify(checkIn));
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
 * Saves an exercise session
 * @param {string} exerciseId - ID of the exercise
 * @param {Object} data - Session data: { stressBefore, stressAfter, completed, duration }
 */
export function saveSession(exerciseId, data) {
  return withStorageErrorHandling(() => {
    if (!exerciseId) {
      throw new Error('Exercise ID is required');
    }
    if (typeof data.stressBefore !== 'number' || typeof data.stressAfter !== 'number') {
      throw new Error('stressBefore and stressAfter must be numbers');
    }
    if (typeof data.duration !== 'number' || data.duration < 0) {
      throw new Error('duration must be a non-negative number');
    }

    const timestamp = Date.now();
    const date = getToday();
    const session = {
      exerciseId,
      stressBefore: data.stressBefore,
      stressAfter: data.stressAfter,
      completed: data.completed === true,
      duration: data.duration,
      timestamp,
      date,
    };

    const key = `${PREFIX}session_${timestamp}`;
    localStorage.setItem(key, JSON.stringify(session));
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
          totalStressReduction: 0,
        });
      }

      const exercise = exerciseMap.get(session.exerciseId);
      exercise.count += 1;
      exercise.totalStressReduction += session.stressBefore - session.stressAfter;
    });

    return Array.from(exerciseMap.values())
      .map((exercise) => ({
        exerciseId: exercise.exerciseId,
        count: exercise.count,
        avgStressReduction: exercise.totalStressReduction / exercise.count,
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

    // Import validated data
    return withStorageErrorHandling(() => {
      Object.keys(data).forEach((key) => {
        localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(data[key]));
      });
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
 * Clears all Steady data from localStorage
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
  });
}
