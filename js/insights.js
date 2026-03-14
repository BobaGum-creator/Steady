/**
 * Steady V5 — Insight Engine
 *
 * Each insight is an object with:
 *   id:         string — unique identifier
 *   priority:   number — lower = higher priority (shown first)
 *   shouldShow: (data) => bool — data threshold check
 *   render:     (data) => string — returns HTML string
 *   action:     (data) => object|null — { type, payload } for the app to handle
 *
 * getInsights(data) returns the top 2 insights that pass their shouldShow() check,
 * sorted by priority, excluding dismissed ones.
 */

import * as storage from './storage.js';

// ============================================================================
// SIGNAL DEFINITIONS (mirrored from app.js for standalone use)
// ============================================================================

const SIGNAL_IDS = ['mind', 'body', 'breath', 'pressure'];

const SIGNAL_NAMES = {
  mind: 'Mind Speed',
  body: 'Body Tension',
  breath: 'Breathing',
  pressure: 'Internal Pressure',
};

const SIGNAL_ICONS = {
  mind: '<svg viewBox="0 0 24 24" fill="none" style="width:18px;height:18px;vertical-align:middle"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="7" stroke="currentColor" stroke-width="1" opacity=".35"/></svg>',
  body: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;vertical-align:middle"><line x1="8" y1="5" x2="8" y2="19"/><line x1="16" y1="5" x2="16" y2="19"/></svg>',
  breath: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="width:18px;height:18px;vertical-align:middle"><path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/></svg>',
  pressure: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;vertical-align:middle"><polyline points="7,15 12,10 17,15"/><polyline points="7,19 12,14 17,19"/></svg>',
};

const SIGNAL_LABELS = {
  mind: 'Racing mind',
  body: 'Body tension',
  breath: 'Shallow breathing',
  pressure: 'Internal pressure',
};

const SIGNAL_LEVELS = {
  mind: ['Calm', 'Busy', 'Racing'],
  body: ['Loose', 'Tight', 'Locked'],
  breath: ['Deep', 'Shallow', 'Stuck'],
  pressure: ['Settled', 'Uneasy', 'Intense'],
};

// ============================================================================
// HELPER UTILITIES
// ============================================================================

function getDateNDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterday() {
  return getDateNDaysAgo(1);
}

function getToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Get ISO week string like '2026-W11' */
function getISOWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function getDayOfWeek() {
  return new Date().getDay(); // 0 = Sunday
}

// ============================================================================
// INSIGHT DEFINITIONS
// ============================================================================

const insights = [

  // ─── 1. CONTINUITY CARD (highest priority — contextual bridge from yesterday) ───
  {
    id: 'continuity',
    priority: 1,
    shouldShow(data) {
      // Trigger: User checked in yesterday with a signal
      // Disappears: After today's check-in
      const todayCheckIn = storage.getTodayCheckIn();
      if (todayCheckIn) return false; // already checked in today

      const history = data.checkInHistory;
      const yesterday = getYesterday();
      return history.some(c => c.date === yesterday && c.primarySignal);
    },
    render(data) {
      const yesterday = getYesterday();
      const yesterdayCheckIn = data.checkInHistory.find(c => c.date === yesterday);
      if (!yesterdayCheckIn) return '';
      const signal = yesterdayCheckIn.primarySignal;
      const label = SIGNAL_LABELS[signal] || signal;

      return `<div class="insight-card insight-continuity" data-insight="continuity">
        <button class="insight-dismiss" aria-label="Dismiss">&times;</button>
        <div class="insight-text">Yesterday was about ${label.toLowerCase()}. How are you feeling today?</div>
      </div>`;
    },
    action(data) {
      return null; // no specific action — just a prompt
    },
  },

  // ─── 2. WEEKLY SUMMARY (high priority on Sunday/Monday) ───
  {
    id: 'weekly-summary',
    priority: 2,
    shouldShow(data) {
      // Only on Sunday (0) or Monday (1)
      const day = getDayOfWeek();
      if (day !== 0 && day !== 1) return false;

      // Check if already dismissed for this week
      const weekOf = getISOWeek(new Date());
      if (storage.isWeeklySummaryDismissed(weekOf)) return false;

      // Need 3+ sessions in the past 7 days
      const sessions = data.recentSessions.filter(s => {
        return s.date >= getDateNDaysAgo(7);
      });
      return sessions.length >= 3;
    },
    render(data) {
      const summary = generateWeeklySummary(data);
      if (!summary) return '';

      let bestLine = '';
      if (summary.bestShift) {
        const sig = summary.bestShift.signal;
        const beforeLabel = SIGNAL_LEVELS[sig]?.[summary.bestShift.before] || '';
        const afterLabel = SIGNAL_LEVELS[sig]?.[summary.bestShift.after] || '';
        const dayDate = new Date(summary.bestShift.date + 'T12:00:00');
        const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
        bestLine = `<div class="insight-detail">Best result: ${SIGNAL_NAMES[sig]} ${beforeLabel} → ${afterLabel} on ${dayName}</div>`;
      }

      let topSignalLine = '';
      if (summary.topSignal) {
        topSignalLine = `<div class="insight-detail">Most common: ${SIGNAL_LABELS[summary.topSignal.signal]} (${summary.topSignal.count}×)</div>`;
      }

      return `<div class="insight-card insight-weekly-summary" data-insight="weekly-summary">
        <button class="insight-dismiss" aria-label="Dismiss">&times;</button>
        <div class="insight-header">Your Week</div>
        <div class="insight-text">${summary.sessionCount} sessions · ${summary.activeDays} days active</div>
        ${topSignalLine}
        ${bestLine}
        <div class="insight-action" data-action="dismiss-weekly">Got it</div>
      </div>`;
    },
    action(data) {
      const weekOf = getISOWeek(new Date());
      storage.dismissWeeklySummary(weekOf);
      return { type: 'refresh' };
    },
  },

  // ─── 3. SIGNAL TREND CARD ───
  {
    id: 'signal-trend',
    priority: 3,
    shouldShow(data) {
      // Trigger: 5+ check-ins in the last 14 days
      return data.checkInHistory.length >= 5;
    },
    render(data) {
      const history = data.checkInHistory;
      const now = new Date();

      // This week's check-ins (last 7 days)
      const thisWeekCutoff = getDateNDaysAgo(7);
      const thisWeek = history.filter(c => c.date >= thisWeekCutoff);

      // Last week's check-ins (8-14 days ago)
      const lastWeekCutoff = getDateNDaysAgo(14);
      const lastWeek = history.filter(c => c.date >= lastWeekCutoff && c.date < thisWeekCutoff);

      // Count signals this week
      const thisWeekCounts = {};
      thisWeek.forEach(c => {
        if (c.primarySignal) thisWeekCounts[c.primarySignal] = (thisWeekCounts[c.primarySignal] || 0) + 1;
      });

      // Find top signal this week
      let topSignal = null, topCount = 0;
      Object.entries(thisWeekCounts).forEach(([sig, count]) => {
        if (count > topCount) { topSignal = sig; topCount = count; }
      });

      if (!topSignal) return '';

      // Count signals last week for comparison
      const lastWeekCounts = {};
      lastWeek.forEach(c => {
        if (c.primarySignal) lastWeekCounts[c.primarySignal] = (lastWeekCounts[c.primarySignal] || 0) + 1;
      });

      // Find last week's top signal rank for comparison
      let text = '';
      const label = SIGNAL_LABELS[topSignal];
      const icon = SIGNAL_ICONS[topSignal];

      if (lastWeek.length >= 3) {
        // We have enough data to compare
        const lastWeekRank = Object.entries(lastWeekCounts)
          .sort((a, b) => b[1] - a[1])
          .findIndex(([sig]) => sig === topSignal);

        if (lastWeekRank === -1 || lastWeekRank > 0) {
          // Signal wasn't top last week
          text = `${label} has been your top signal ${topCount} of the last ${thisWeek.length} days`;
        } else {
          // Was also top last week — show consistency
          text = `${label} remains your most frequent signal this week`;
        }
      } else {
        text = `${label} has been your top signal ${topCount} of the last ${thisWeek.length} days`;
      }

      return `<div class="insight-card insight-trend" data-insight="signal-trend" data-signal="${topSignal}">
        <button class="insight-dismiss" aria-label="Dismiss">&times;</button>
        <div class="insight-icon">${icon}</div>
        <div class="insight-text">${text}</div>
        <div class="insight-action" data-action="select-signal" data-signal="${topSignal}">See exercises →</div>
      </div>`;
    },
    action(data) {
      // The app wires this: tapping selects the signal and scrolls to recommendations
      return { type: 'select-signal', payload: null }; // payload filled by click handler
    },
  },

  // ─── 4. BEST TOOL CARD ───
  {
    id: 'best-tool',
    priority: 4,
    shouldShow(data) {
      // Trigger: 3+ completed sessions with signal data for any signal
      const signalEff = data.signalEffectiveness;
      for (const [exerciseId, eff] of signalEff) {
        if (eff.count >= 3) {
          // Check if any signal has meaningful reduction
          for (const sig of SIGNAL_IDS) {
            if (eff[sig] > 0.3) return true;
          }
        }
      }
      return false;
    },
    render(data) {
      const signalEff = data.signalEffectiveness;
      // Find the active signal or most frequent signal
      const targetSignal = data.activeSignal || getMostFrequentSignal(data.checkInHistory);
      if (!targetSignal) return '';

      // Find best exercise for this signal
      let bestExercise = null, bestReduction = 0, bestCount = 0;
      for (const [exerciseId, eff] of signalEff) {
        if (eff.count >= 3 && eff[targetSignal] > bestReduction) {
          bestReduction = eff[targetSignal];
          bestExercise = exerciseId;
          bestCount = eff.count;
        }
      }

      if (!bestExercise || bestReduction <= 0.3) return '';

      // Get exercise name from data
      const exercise = data.exercises?.find(e => e.id === bestExercise);
      const exerciseName = exercise ? exercise.title : bestExercise;
      const signalName = SIGNAL_NAMES[targetSignal]?.toLowerCase() || targetSignal;

      const text = `${exerciseName} dropped your ${signalName} by an average of ${bestReduction.toFixed(1)} levels`;

      return `<div class="insight-card insight-best-tool" data-insight="best-tool" data-exercise="${bestExercise}">
        <button class="insight-dismiss" aria-label="Dismiss">&times;</button>
        <div class="insight-text">${text}</div>
        <div class="insight-action" data-action="start-exercise" data-exercise="${bestExercise}">Try it →</div>
      </div>`;
    },
    action(data) {
      return { type: 'start-exercise', payload: null }; // payload filled by click handler
    },
  },

  // ─── 5. STREAK & CONSISTENCY CARD ───
  {
    id: 'streak',
    priority: 5,
    shouldShow(data) {
      const streak = data.streak;
      // Show if current >= 3 OR if user just broke a streak of 3+
      if (streak.current >= 3) return true;
      if (streak.current === 0 && streak.longest >= 3) {
        // Check if they were active recently (broke streak in last 3 days)
        const sessions = data.recentSessions;
        const threeDaysAgo = getDateNDaysAgo(3);
        return sessions.some(s => s.date >= threeDaysAgo);
      }
      return false;
    },
    render(data) {
      const streak = data.streak;
      let text = '';

      if (streak.current >= 3) {
        if (streak.current >= streak.longest) {
          text = `${streak.current} days consistent — your longest streak yet`;
        } else {
          text = `${streak.current} days in a row — keep going`;
        }
      } else {
        // Broken streak — encouraging
        const weekSessions = data.recentSessions.filter(s => s.date >= getDateNDaysAgo(7));
        if (weekSessions.length > 0) {
          text = `You missed yesterday, but you've done ${weekSessions.length} session${weekSessions.length === 1 ? '' : 's'} this week — that's great`;
        } else {
          return ''; // no recent data, skip
        }
      }

      return `<div class="insight-card insight-streak" data-insight="streak">
        <button class="insight-dismiss" aria-label="Dismiss">&times;</button>
        <div class="insight-text">${text}</div>
      </div>`;
    },
    action() {
      return null;
    },
  },

  // ─── 6. TIME PATTERN CARD ───
  {
    id: 'time-pattern',
    priority: 6,
    shouldShow(data) {
      // Trigger: 10+ sessions with timestamps
      return data.recentSessions.filter(s => s.timestamp).length >= 10;
    },
    render(data) {
      const sessions = data.recentSessions.filter(s => s.timestamp && s.signalsBefore && s.signalsAfter);
      if (sessions.length < 10) return '';

      // Categorize by time of day
      const buckets = { morning: [], afternoon: [], evening: [] };
      sessions.forEach(s => {
        const hour = new Date(s.timestamp).getHours();
        if (hour < 12) buckets.morning.push(s);
        else if (hour < 17) buckets.afternoon.push(s);
        else buckets.evening.push(s);
      });

      // Calculate avg total relief per bucket
      function avgRelief(arr) {
        if (arr.length === 0) return 0;
        let total = 0;
        arr.forEach(s => {
          SIGNAL_IDS.forEach(sig => {
            total += (s.signalsBefore[sig] || 0) - (s.signalsAfter[sig] || 0);
          });
        });
        return total / arr.length;
      }

      const reliefs = {
        morning: avgRelief(buckets.morning),
        afternoon: avgRelief(buckets.afternoon),
        evening: avgRelief(buckets.evening),
      };

      // Find most used time
      let mostUsedTime = 'morning';
      let mostUsedCount = buckets.morning.length;
      Object.entries(buckets).forEach(([time, arr]) => {
        if (arr.length > mostUsedCount) {
          mostUsedTime = time;
          mostUsedCount = arr.length;
        }
      });

      // Find best-result time (with at least 3 sessions)
      let bestTime = null, bestRelief = 0;
      Object.entries(reliefs).forEach(([time, relief]) => {
        if (buckets[time].length >= 3 && relief > bestRelief) {
          bestTime = time;
          bestRelief = relief;
        }
      });

      let text = '';
      if (bestTime && bestTime === mostUsedTime) {
        text = `You tend to practice in the ${mostUsedTime} — your sessions have the best relief then`;
      } else if (bestTime && bestTime !== mostUsedTime) {
        const pct = bestRelief > 0 ? Math.round((bestRelief / Math.max(reliefs[mostUsedTime], 0.1)) * 100 - 100) : 0;
        if (pct > 20) {
          text = `${capitalize(bestTime)} sessions work better for you — ${pct}% more relief than ${mostUsedTime}`;
        } else {
          text = `You tend to practice in the ${mostUsedTime}`;
        }
      } else {
        text = `You tend to practice in the ${mostUsedTime}`;
      }

      return `<div class="insight-card insight-time" data-insight="time-pattern">
        <button class="insight-dismiss" aria-label="Dismiss">&times;</button>
        <div class="insight-text">${text}</div>
      </div>`;
    },
    action() {
      return null;
    },
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getMostFrequentSignal(checkInHistory) {
  const counts = {};
  checkInHistory.forEach(c => {
    if (c.primarySignal) counts[c.primarySignal] = (counts[c.primarySignal] || 0) + 1;
  });
  let top = null, topCount = 0;
  Object.entries(counts).forEach(([sig, count]) => {
    if (count > topCount) { top = sig; topCount = count; }
  });
  return top;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateWeeklySummary(data) {
  const cutoff = getDateNDaysAgo(7);
  const sessions = data.recentSessions.filter(s => s.date >= cutoff);
  if (sessions.length < 3) return null;

  // Count active days
  const activeDays = new Set(sessions.map(s => s.date)).size;

  // Most common signal from check-ins
  const checkIns = data.checkInHistory.filter(c => c.date >= cutoff);
  const signalCounts = {};
  checkIns.forEach(c => {
    if (c.primarySignal) signalCounts[c.primarySignal] = (signalCounts[c.primarySignal] || 0) + 1;
  });

  let topSignal = null;
  let topSignalCount = 0;
  Object.entries(signalCounts).forEach(([sig, count]) => {
    if (count > topSignalCount) { topSignal = sig; topSignalCount = count; }
  });

  // Best single-session result
  let bestShift = null;
  sessions.forEach(s => {
    if (!s.signalsBefore || !s.signalsAfter) return;
    SIGNAL_IDS.forEach(sig => {
      const drop = (s.signalsBefore[sig] || 0) - (s.signalsAfter[sig] || 0);
      if (!bestShift || drop > bestShift.drop) {
        bestShift = {
          exerciseId: s.exerciseId,
          signal: sig,
          drop,
          before: s.signalsBefore[sig],
          after: s.signalsAfter[sig],
          date: s.date,
        };
      }
    });
  });

  return {
    sessionCount: sessions.length,
    activeDays,
    topSignal: topSignal ? { signal: topSignal, count: topSignalCount } : null,
    bestShift: bestShift && bestShift.drop > 0 ? bestShift : null,
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Returns the top 2 insights that pass their shouldShow() check,
 * sorted by priority, excluding dismissed ones.
 *
 * @param {Object} data - { checkInHistory, recentSessions, signalEffectiveness, streak, activeSignal, exercises }
 * @returns {Array} Array of { id, html, insight } objects
 */
export function getInsights(data) {
  const dismissed = storage.getDismissedInsights();

  return insights
    .filter(insight => {
      // Skip dismissed
      if (dismissed[insight.id]) return false;
      // Check data threshold
      try {
        return insight.shouldShow(data);
      } catch (e) {
        return false;
      }
    })
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 2)
    .map(insight => {
      try {
        const html = insight.render(data);
        return html ? { id: insight.id, html, insight } : null;
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean);
}

/**
 * Get the exercise report card data for a completed session.
 * Returns null if data threshold not met (< 2 previous sessions).
 *
 * @param {string} exerciseId - The exercise just completed
 * @param {Object} preSignals - Pre-exercise signals
 * @param {Object} postSignals - Post-exercise signals
 * @param {Object} data - { recentSessions, signalEffectiveness, exercises }
 * @returns {Object|null} { exerciseName, sessionCount, bestSignalInsight, shifts }
 */
export function getExerciseReport(exerciseId, preSignals, postSignals, data) {
  // Find previous sessions with this exercise (not counting the one just saved)
  const prevSessions = data.recentSessions.filter(s =>
    s.exerciseId === exerciseId && s.completed
  );

  // Need 2+ previous sessions
  if (prevSessions.length < 2) return null;

  const exercise = data.exercises?.find(e => e.id === exerciseId);
  const exerciseName = exercise ? exercise.title : exerciseId;

  // Calculate shifts for this session
  const shifts = [];
  if (preSignals && postSignals) {
    SIGNAL_IDS.forEach(sig => {
      const before = preSignals[sig] || 0;
      const after = postSignals[sig] || 0;
      if (before > after) {
        shifts.push({
          signal: sig,
          name: SIGNAL_NAMES[sig],
          before: SIGNAL_LEVELS[sig]?.[before] || '',
          after: SIGNAL_LEVELS[sig]?.[after] || '',
        });
      }
    });
  }

  // Best signal insight from effectiveness data
  let bestSignalInsight = '';
  const sigEff = data.signalEffectiveness.get(exerciseId);
  if (sigEff && sigEff.count >= 2) {
    let bestSig = null, bestAvg = 0;
    SIGNAL_IDS.forEach(sig => {
      if (sigEff[sig] > bestAvg) { bestAvg = sigEff[sig]; bestSig = sig; }
    });
    if (bestSig && bestAvg > 0.3) {
      bestSignalInsight = `It's been your best tool for ${SIGNAL_NAMES[bestSig].toLowerCase()}`;
    }
  }

  return {
    exerciseName,
    sessionCount: prevSessions.length + 1, // including this one
    bestSignalInsight,
    shifts,
  };
}

/**
 * Generate signal history chart data for the last 14 days.
 * Returns a grid of day × signal with levels.
 *
 * @param {Array} recentSessions - Sessions from last 14 days
 * @returns {Object} { days: [{date, dayLabel, signals: {mind: 0-2, ...}}], hasData: bool }
 */
export function getSignalChartData(recentSessions) {
  const today = new Date();
  const days = [];

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });

    // Find sessions for this day
    const daySessions = recentSessions.filter(s => s.date === dateStr && s.signalsBefore);

    // Use highest signal level if multiple sessions (worst-case snapshot)
    const signals = {};
    SIGNAL_IDS.forEach(sig => {
      let maxLevel = -1;
      daySessions.forEach(s => {
        const level = s.signalsBefore[sig];
        if (level !== undefined && level > maxLevel) maxLevel = level;
      });
      signals[sig] = maxLevel >= 0 ? maxLevel : -1; // -1 = no data
    });

    days.push({ date: dateStr, dayLabel, signals, hasData: daySessions.length > 0 });
  }

  const hasData = days.filter(d => d.hasData).length >= 3;
  return { days, hasData };
}
