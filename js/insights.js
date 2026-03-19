import { getSessions, getStreak, getDismissedInsights, getChallengeProgram, getReflections, getIntentionStats } from './storage.js';

const INSIGHT_TYPES = [
  {
    id: 'streak-milestone',
    priority: 1,
    title: (streak) => `${streak}-day streak`,
    message: (streak) => `You've practiced ${streak} days in a row. Consistency builds resilience.`,
    condition: () => {
      const streak = getStreak();
      return streak > 0 && streak % 7 === 0; // Show at 7, 14, 21...
    },
    getData: () => ({ streak: getStreak() })
  },
  {
    id: 'challenge-unlock',
    priority: 2,
    title: () => 'Challenge unlocked',
    message: () => 'You\'ve built a foundation. Ready to test your skills under pressure?',
    condition: () => {
      try {
        const program = getChallengeProgram();
        return (
          program &&
          program.unlocked === true &&
          program.currentDay === 1 &&
          Array.isArray(program.completedDays) &&
          program.completedDays.length === 0
        );
      } catch (e) {
        return false;
      }
    }
  },
  {
    id: 'best-exercise',
    priority: 3,
    title: (data) => `${data.title} works for you`,
    message: (data) => `Your signals drop most after ${data.title}. It's your most effective exercise.`,
    condition: () => {
      try {
        const sessions = getSessions();
        return Array.isArray(sessions) && sessions.length >= 5;
      } catch (e) {
        return false;
      }
    },
    getData: () => {
      try {
        const sessions = getSessions();
        if (!Array.isArray(sessions) || sessions.length === 0) {
          return { exerciseId: null, title: 'your practice' };
        }

        const exerciseStats = {};

        sessions.forEach(s => {
          if (!s || !s.signalsBefore || !s.signalsAfter || !s.exerciseId) return;

          const before = Object.values(s.signalsBefore).reduce((a, b) => {
            return (typeof a === 'number' ? a : 0) + (typeof b === 'number' ? b : 0);
          }, 0);
          const after = Object.values(s.signalsAfter).reduce((a, b) => {
            return (typeof a === 'number' ? a : 0) + (typeof b === 'number' ? b : 0);
          }, 0);
          const reduction = before - after;

          if (!exerciseStats[s.exerciseId]) {
            exerciseStats[s.exerciseId] = { total: 0, count: 0 };
          }
          exerciseStats[s.exerciseId].total += reduction;
          exerciseStats[s.exerciseId].count++;
        });

        let bestId = null;
        let bestAvg = -Infinity;

        Object.entries(exerciseStats).forEach(([id, stats]) => {
          if (stats.count >= 2) {
            const avg = stats.total / stats.count;
            if (avg > bestAvg) {
              bestAvg = avg;
              bestId = id;
            }
          }
        });

        return { exerciseId: bestId, title: bestId || 'your practice' };
      } catch (e) {
        return { exerciseId: null, title: 'your practice' };
      }
    }
  },
  {
    id: 'intention-progress',
    priority: 4,
    title: (data) => 'Real-world training',
    message: (data) => `You've trained ${data.topCount} times for ${data.topCategory}. That focus pays off.`,
    condition: () => {
      try {
        const stats = getIntentionStats();
        if (typeof stats !== 'object') return false;
        return Object.values(stats).some(count => typeof count === 'number' && count >= 3);
      } catch (e) {
        return false;
      }
    },
    getData: () => {
      try {
        const stats = getIntentionStats();
        if (typeof stats !== 'object') {
          return { topCategory: 'resilience', topCount: 0 };
        }

        let topCat = '';
        let topCount = 0;

        Object.entries(stats).forEach(([cat, count]) => {
          if (typeof count === 'number' && count > topCount) {
            topCount = count;
            topCat = cat;
          }
        });

        return { topCategory: topCat.replace(/-/g, ' '), topCount };
      } catch (e) {
        return { topCategory: 'resilience', topCount: 0 };
      }
    }
  },
  {
    id: 'reflection-trend',
    priority: 5,
    title: () => 'Getting steadier',
    message: () => 'Your recent reflections show improved regulation. The training is transferring.',
    condition: () => {
      try {
        const reflections = getReflections();
        if (!Array.isArray(reflections) || reflections.length < 3) {
          return false;
        }

        const recent = reflections.slice(-3);
        const avgLevel = recent.reduce((sum, r) => {
          const level = r && typeof r.regulationLevel === 'number' ? r.regulationLevel : 0;
          return sum + level;
        }, 0) / recent.length;

        return avgLevel >= 1.5; // Trending toward "Steady"
      } catch (e) {
        return false;
      }
    }
  },
  {
    id: 'try-relief',
    priority: 6,
    title: () => 'Relief tools available',
    message: () => 'Feeling stressed? Tap a signal below for a personalized exercise recommendation.',
    condition: () => {
      try {
        const sessions = getSessions();
        if (!Array.isArray(sessions)) return false;
        return sessions.length >= 1 && sessions.length <= 3; // Early user guidance
      } catch (e) {
        return false;
      }
    }
  }
];

/**
 * Get active insights to display (max 2, filtered by cooldown and priority)
 * @param {number} maxCount - Maximum number of insights to return (default 2)
 * @returns {Array} Array of active insight objects with title, message, and data
 */
function getActiveInsights(maxCount = 2) {
  if (typeof maxCount !== 'number' || maxCount < 1) {
    maxCount = 2;
  }

  try {
    const dismissed = getDismissedInsights();
    const now = Date.now();
    const COOLDOWN = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    if (typeof dismissed !== 'object') {
      dismissed = {};
    }

    // Filter insights by cooldown and condition
    const eligible = INSIGHT_TYPES.filter(insight => {
      if (!insight || !insight.id) return false;

      // Check if insight is in cooldown period
      if (dismissed[insight.id]) {
        const dismissedTime = dismissed[insight.id];
        if (typeof dismissedTime === 'number' && (now - dismissedTime) < COOLDOWN) {
          return false;
        }
      }

      // Check if condition is met
      try {
        return typeof insight.condition === 'function' && insight.condition();
      } catch (e) {
        return false;
      }
    });

    // Sort by priority (lower number = higher priority)
    eligible.sort((a, b) => {
      const aPriority = typeof a.priority === 'number' ? a.priority : Infinity;
      const bPriority = typeof b.priority === 'number' ? b.priority : Infinity;
      return aPriority - bPriority;
    });

    // Return up to maxCount insights with their data
    return eligible.slice(0, maxCount).map(insight => {
      try {
        const data = typeof insight.getData === 'function' ? insight.getData() : {};

        return {
          id: insight.id,
          title: typeof insight.title === 'function' ? insight.title(data) : String(insight.title || 'Insight'),
          message: typeof insight.message === 'function' ? insight.message(data) : String(insight.message || ''),
          data: data || {}
        };
      } catch (e) {
        // Skip this insight if there's an error processing it
        return null;
      }
    }).filter(insight => insight !== null);
  } catch (e) {
    // Return empty array if there's a critical error
    return [];
  }
}

/**
 * Get a personalized relief exercise recommendation for a given signal
 * @param {string} signalId - The ID of the signal to get relief for
 * @param {Array} exercisesData - Array of exercise objects with metadata
 * @returns {Object|null} The recommended exercise object or null if none available
 */
function getReliefRecommendation(signalId, exercisesData) {
  if (!signalId || typeof signalId !== 'string') {
    return null;
  }

  if (!Array.isArray(exercisesData) || exercisesData.length === 0) {
    return null;
  }

  try {
    const sessions = getSessions();
    let bookmarks = [];

    try {
      const bookmarksData = localStorage.getItem('steady_bookmarks');
      bookmarks = JSON.parse(bookmarksData || '[]');
      if (!Array.isArray(bookmarks)) bookmarks = [];
    } catch (e) {
      bookmarks = [];
    }

    const today = new Date().toISOString().split('T')[0];

    // Filter to relief exercises
    const reliefExercises = exercisesData.filter(e =>
      e && e.mode && (e.mode === 'relief' || e.mode === 'both')
    );

    if (reliefExercises.length === 0) {
      return null;
    }

    // Score each exercise
    const scored = reliefExercises.map(exercise => {
      let score = 0;

      // Signal match (+5)
      if (
        Array.isArray(exercise.signals) &&
        exercise.signals.includes(signalId)
      ) {
        score += 5;
      }

      // Personal effectiveness (+4 if 2+ sessions with >0.5 avg reduction for this signal)
      if (Array.isArray(sessions) && exercise.id) {
        const exSessions = sessions.filter(
          s => s && s.exerciseId === exercise.id
        );

        if (exSessions.length >= 2) {
          const reductions = exSessions
            .filter(s => s && s.signalsBefore && s.signalsAfter)
            .map(s => {
              const before = s.signalsBefore[signalId];
              const after = s.signalsAfter[signalId];
              const beforeVal = typeof before === 'number' ? before : 0;
              const afterVal = typeof after === 'number' ? after : 0;
              return beforeVal - afterVal;
            });

          if (reductions.length > 0) {
            const avgReduction = reductions.reduce((a, b) => a + b, 0) / reductions.length;
            if (avgReduction > 0.5) {
              score += 4;
            }
          }
        }
      }

      // Evidence (+2 strong, +1 moderate)
      if (exercise.evidence === 'strong') {
        score += 2;
      } else if (exercise.evidence === 'moderate') {
        score += 1;
      }

      // Used today penalty (-1)
      if (Array.isArray(sessions)) {
        const usedToday = sessions.some(
          s => s && s.exerciseId === exercise.id && s.date === today
        );
        if (usedToday) {
          score -= 1;
        }
      }

      // Favorite boost (+1)
      if (bookmarks.includes(exercise.id)) {
        score += 1;
      }

      return { exercise, score };
    });

    // Sort by score (descending)
    scored.sort((a, b) => b.score - a.score);

    return scored[0]?.exercise || null;
  } catch (e) {
    // Return null if there's any error in the recommendation logic
    return null;
  }
}

export { getActiveInsights, getReliefRecommendation, INSIGHT_TYPES };
