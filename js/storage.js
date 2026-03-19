/**
 * Steady - Storage Layer
 * Handles all localStorage operations with 'steady_' prefix
 * @module storage
 */

const PREFIX = 'steady_';

/**
 * Safely parse JSON with fallback
 * @param {string} json - JSON string to parse
 * @param {*} fallback - Value to return if parse fails
 * @returns {*} Parsed object or fallback
 */
function safeParse(json, fallback = null) {
  try {
    return json ? JSON.parse(json) : fallback;
  } catch (e) {
    console.error('Failed to parse JSON:', e);
    return fallback;
  }
}

/**
 * Safely stringify to JSON
 * @param {*} obj - Object to stringify
 * @param {string} fallback - Value to return if stringify fails
 * @returns {string} JSON string or fallback
 */
function safeStringify(obj, fallback = '{}') {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    console.error('Failed to stringify object:', e);
    return fallback;
  }
}

/**
 * Get localStorage key with prefix
 * @param {string} key - Key name
 * @returns {string} Prefixed key
 */
function getKey(key) {
  return `${PREFIX}${key}`;
}

// ============================================================================
// SESSIONS
// ============================================================================

/**
 * Save array of sessions
 * @param {Array<Object>} sessions - Sessions array
 */
export function saveSessions(sessions) {
  localStorage.setItem(getKey('sessions'), safeStringify(sessions));
}

/**
 * Get all sessions
 * @returns {Array<Object>} Sessions array
 */
export function getSessions() {
  return safeParse(localStorage.getItem(getKey('sessions')), []);
}

/**
 * Add session to sessions array
 * @param {Object} session - Session object to add
 */
export function addSession(session) {
  const sessions = getSessions();
  sessions.push({
    ...session,
    timestamp: session.timestamp || new Date().toISOString(),
  });
  saveSessions(sessions);
}

// ============================================================================
// DAILY PRACTICE TRACKING
// ============================================================================

/**
 * Get daily practice for specific date
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Object|null} Practice object or null
 */
export function getDailyPractice(dateStr) {
  const practices = safeParse(localStorage.getItem(getKey('daily_practice')), {});
  return practices[dateStr] || null;
}

/**
 * Save daily practice completion
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @param {string} exerciseId - Exercise ID used
 */
export function saveDailyPractice(dateStr, exerciseId) {
  const practices = safeParse(localStorage.getItem(getKey('daily_practice')), {});
  practices[dateStr] = {
    completed: true,
    exerciseId,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(getKey('daily_practice'), safeStringify(practices));
}

// ============================================================================
// STREAKS
// ============================================================================

/**
 * Calculate current streak (consecutive days with completed practice)
 * Yesterday counts if today is not done yet
 * @returns {number} Current streak length
 */
export function getStreak() {
  const practices = safeParse(localStorage.getItem(getKey('daily_practice')), {});
  const today = new Date();
  let streak = 0;
  let checkDate = new Date(today);

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (practices[dateStr]?.completed) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get longest streak ever achieved
 * @returns {number} Longest streak
 */
export function getLongestStreak() {
  const metadata = safeParse(localStorage.getItem(getKey('streak_metadata')), {
    longest: 0,
  });
  return metadata.longest || 0;
}

/**
 * Update longest streak (internal, called by challenge logic)
 * @param {number} streak - Current streak to check against
 * @private
 */
function updateLongestStreak(streak) {
  const metadata = safeParse(localStorage.getItem(getKey('streak_metadata')), {
    longest: 0,
  });
  if (streak > metadata.longest) {
    metadata.longest = streak;
    localStorage.setItem(getKey('streak_metadata'), safeStringify(metadata));
  }
}

// ============================================================================
// JOURNAL
// ============================================================================

/**
 * Save journal entry
 * @param {Object} entry - {stressor, inControl, nextStep, date, timestamp}
 */
export function saveJournalEntry(entry) {
  const entries = getJournalEntries();
  entries.push({
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString(),
    id: `journal_${Date.now()}`,
  });
  localStorage.setItem(getKey('journal'), safeStringify(entries));
}

/**
 * Get all journal entries
 * @returns {Array<Object>} Journal entries
 */
export function getJournalEntries() {
  return safeParse(localStorage.getItem(getKey('journal')), []);
}

// ============================================================================
// REFLECTIONS
// ============================================================================

/**
 * Save reflection entry
 * @param {Object} reflection - {situation, usedTools, regulationLevel, wouldChange, date, timestamp}
 */
export function saveReflection(reflection) {
  const reflections = getReflections();
  reflections.push({
    ...reflection,
    timestamp: reflection.timestamp || new Date().toISOString(),
    id: `reflection_${Date.now()}`,
  });
  localStorage.setItem(getKey('reflections'), safeStringify(reflections));
}

/**
 * Get all reflections
 * @returns {Array<Object>} Reflections array
 */
export function getReflections() {
  return safeParse(localStorage.getItem(getKey('reflections')), []);
}

// ============================================================================
// CHALLENGE PROGRAM
// ============================================================================

/**
 * Get challenge program state
 * @returns {Object} {currentDay, cycleNumber, startDate, completedDays, unlocked}
 */
export function getChallengeProgram() {
  return safeParse(localStorage.getItem(getKey('challenge')), {
    currentDay: 1,
    level: 1,
    cycleNumber: 1,
    startDate: new Date().toISOString(),
    completedDays: [],
    unlocked: false,
  });
}

/**
 * Save challenge program state
 * @param {Object} program - Challenge program object
 */
export function saveChallengeProgram(program) {
  localStorage.setItem(getKey('challenge'), safeStringify(program));
}

/**
 * Advance to next challenge day
 */
export function advanceChallengeDay() {
  const program = getChallengeProgram();
  program.currentDay += 1;
  const today = new Date().toISOString().split('T')[0];
  if (!program.completedDays.includes(today)) {
    program.completedDays.push(today);
  }
  saveChallengeProgram(program);
  updateLongestStreak(getStreak());
}

/**
 * Check if challenge is unlocked (3+ daily practices completed)
 * @returns {boolean} Unlock status
 */
export function isChallengeUnlocked() {
  const practices = safeParse(localStorage.getItem(getKey('daily_practice')), {});
  const completedCount = Object.values(practices).filter((p) => p?.completed).length;
  return completedCount >= 3;
}

/**
 * Reset challenge — advance to next level
 */
export function resetChallenge() {
  const program = getChallengeProgram();
  const previousLevel = program.level || 1;
  program.currentDay = 1;
  program.level = previousLevel + 1;
  program.cycleNumber += 1;
  program.startDate = new Date().toISOString();
  program.completedDays = [];
  saveChallengeProgram(program);
}

// ============================================================================
// PRACTICE INTENTIONS
// ============================================================================

/**
 * Get aggregated intention statistics from all sessions
 * @returns {Object} {categoryId: count}
 */
export function getIntentionStats() {
  const sessions = getSessions();
  const stats = {};

  sessions.forEach((session) => {
    if (session.intention?.categoryId) {
      stats[session.intention.categoryId] =
        (stats[session.intention.categoryId] || 0) + 1;
    }
  });

  return stats;
}

// ============================================================================
// CHECK-INS
// ============================================================================

/**
 * Save check-in
 * @param {Object} checkIn - {primarySignal, timestamp}
 */
export function saveCheckIn(checkIn) {
  const checkIns = getCheckIns();
  checkIns.push({
    ...checkIn,
    timestamp: checkIn.timestamp || new Date().toISOString(),
    id: `checkin_${Date.now()}`,
  });
  localStorage.setItem(getKey('checkins'), safeStringify(checkIns));
}

/**
 * Get all check-ins
 * @returns {Array<Object>} Check-ins array
 */
export function getCheckIns() {
  return safeParse(localStorage.getItem(getKey('checkins')), []);
}

// ============================================================================
// PROFILE
// ============================================================================

/**
 * Get user profile
 * @returns {Object} {completed, preferredModalities, goals}
 */
export function getProfile() {
  return safeParse(localStorage.getItem(getKey('profile')), {
    completed: false,
    preferredModalities: [],
    goals: [],
  });
}

/**
 * Save user profile
 * @param {Object} profile - Profile object
 */
export function saveProfile(profile) {
  localStorage.setItem(getKey('profile'), safeStringify(profile));
}

// ============================================================================
// SETTINGS
// ============================================================================

/**
 * Get user settings
 * @returns {Object} {sound, reducedMotion, theme, reminderEnabled, reminderTime}
 */
export function getSettings() {
  return safeParse(localStorage.getItem(getKey('settings')), {
    sound: true,
    reducedMotion: false,
    theme: 'dark',
    reminderEnabled: false,
    reminderTime: '09:00',
  });
}

/**
 * Save user settings
 * @param {Object} settings - Settings object
 */
export function saveSettings(settings) {
  localStorage.setItem(getKey('settings'), safeStringify(settings));
}

// ============================================================================
// INSIGHTS
// ============================================================================

/**
 * Get dismissed insights (with 7-day cooldown)
 * @returns {Object} {insightId: dismissTimestamp}
 */
export function getDismissedInsights() {
  return safeParse(localStorage.getItem(getKey('dismissed_insights')), {});
}

/**
 * Dismiss an insight (7-day cooldown)
 * @param {string} insightId - ID of insight to dismiss
 */
export function dismissInsight(insightId) {
  const dismissed = getDismissedInsights();
  dismissed[insightId] = new Date().toISOString();
  localStorage.setItem(getKey('dismissed_insights'), safeStringify(dismissed));
}

// ============================================================================
// BOOKMARKS
// ============================================================================

/**
 * Get bookmarked exercise IDs
 * @returns {Array<string>} Exercise IDs
 */
export function getBookmarks() {
  return safeParse(localStorage.getItem(getKey('bookmarks')), []);
}

/**
 * Toggle bookmark status for exercise
 * @param {string} exerciseId - Exercise ID to toggle
 */
export function toggleBookmark(exerciseId) {
  let bookmarks = getBookmarks();
  const index = bookmarks.indexOf(exerciseId);
  if (index > -1) {
    bookmarks.splice(index, 1);
  } else {
    bookmarks.push(exerciseId);
  }
  localStorage.setItem(getKey('bookmarks'), safeStringify(bookmarks));
}

// ============================================================================
// DATA MANAGEMENT
// ============================================================================

/**
 * Export all data as JSON string
 * @returns {string} JSON string of all steady_ keys
 */
export function exportAllData() {
  const allData = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) {
      allData[key] = localStorage.getItem(key);
    }
  }
  return safeStringify(allData);
}

/**
 * Import data from JSON string (replaces existing)
 * @param {string} jsonStr - JSON string from exportAllData
 */
export function importAllData(jsonStr) {
  try {
    const data = safeParse(jsonStr, {});
    // Clear existing steady_ data
    clearAllData();
    // Import new data
    Object.entries(data).forEach(([key, value]) => {
      if (key.startsWith(PREFIX)) {
        localStorage.setItem(key, value);
      }
    });
  } catch (e) {
    console.error('Failed to import data:', e);
  }
}

/**
 * Clear all steady_ data
 */
export function clearAllData() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get weekly activity summary (last 7 days)
 * @returns {Array<Object>} [{date, count}, ...]
 */
export function getWeeklyActivity() {
  const practices = safeParse(localStorage.getItem(getKey('daily_practice')), {});
  const sessions = getSessions();
  const activity = {};
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    activity[dateStr] = {
      date: dateStr,
      count: sessions.filter(
        (s) =>
          s.timestamp && s.timestamp.split('T')[0] === dateStr
      ).length,
    };
  }

  return Object.values(activity).reverse();
}

/**
 * Get session count for last 30 days
 * @returns {number} Number of sessions
 */
export function getMonthlySessionCount() {
  const sessions = getSessions();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return sessions.filter((session) => {
    const sessionDate = new Date(session.timestamp);
    return sessionDate >= thirtyDaysAgo;
  }).length;
}

/**
 * Get most used exercises
 * @param {number} limit - Number of exercises to return
 * @returns {Array<Object>} [{exerciseId, count}, ...]
 */
export function getMostUsedExercises(limit = 5) {
  const sessions = getSessions();
  const counts = {};

  sessions.forEach((session) => {
    if (session.exerciseId) {
      counts[session.exerciseId] = (counts[session.exerciseId] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .map(([exerciseId, count]) => ({ exerciseId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Calculate exercise effectiveness (avg signal reduction over 90 days)
 * @param {string} exerciseId - Exercise ID
 * @returns {number|null} Average signal reduction or null
 */
// ============================================================================
// BACKUP TRACKING
// ============================================================================

/**
 * Get the number of sessions since last backup export
 * @returns {number} Sessions since last export
 */
export function getSessionsSinceBackup() {
  const lastBackup = safeParse(localStorage.getItem(getKey('last_backup')), null);
  if (!lastBackup) {
    // Never backed up — return total session count
    return getSessions().length;
  }
  const sessions = getSessions();
  return sessions.filter(s => {
    const ts = s.timestamp ? new Date(s.timestamp).getTime() : 0;
    return ts > lastBackup;
  }).length;
}

/**
 * Mark that a backup was just performed
 */
export function markBackupDone() {
  localStorage.setItem(getKey('last_backup'), safeStringify(Date.now()));
}

/**
 * Check if backup reminder should be shown (every 7 sessions without backup)
 * @returns {boolean}
 */
export function shouldShowBackupReminder() {
  const sinceBackup = getSessionsSinceBackup();
  // Also check if dismissed recently (within last 24h)
  const dismissed = safeParse(localStorage.getItem(getKey('backup_dismissed')), 0);
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  if (dismissed > oneDayAgo) return false;
  return sinceBackup >= 7;
}

/**
 * Dismiss backup reminder for 24h
 */
export function dismissBackupReminder() {
  localStorage.setItem(getKey('backup_dismissed'), safeStringify(Date.now()));
}

export function getExerciseEffectiveness(exerciseId) {
  const sessions = getSessions();
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const relevant = sessions.filter((s) => {
    return (
      s.exerciseId === exerciseId &&
      new Date(s.timestamp) >= ninetyDaysAgo &&
      typeof s.signalBefore === 'number' &&
      typeof s.signalAfter === 'number'
    );
  });

  if (relevant.length === 0) return null;

  const totalReduction = relevant.reduce(
    (sum, s) => sum + (s.signalBefore - s.signalAfter),
    0
  );
  return totalReduction / relevant.length;
}
