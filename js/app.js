/**
 * Steady - Main Application Module (V5)
 *
 * Orchestrates all views, handles routing, wires up player, storage, and data modules.
 * V2: theme toggle, favorites, recommendations, audio cues, weekly chart, share, reminders.
 * V3: outcome-based recommendations, onboarding flow, narration layer, haptic feedback.
 * V4: 4-signal state check system replacing single stress slider.
 * V5: Insight cards, signal history chart, exercise report card, smart defaults, weekly summary.
 */

import { exercises, getExercise, getExercisesByCategory, getTrainingExercises, getReliefExercises, categories } from './data.js';
import * as storage from './storage.js';
import { createPlayer } from './player.js';
import { getInsights, getExerciseReport, getSignalChartData } from './insights.js';

// ============================================================================
// STATE & CONFIGURATION
// ============================================================================

// ============================================================================
// V4 SIGNAL DEFINITIONS
// ============================================================================

const SIGNALS = {
  mind: {
    id: 'mind',
    name: 'Mind Speed',
    icon: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="7" stroke="currentColor" stroke-width="1" opacity=".35"/></svg>',
    cardLabel: 'Racing Mind',
    cardHint: "Thoughts won't quiet down",
    levels: ['Calm', 'Busy', 'Racing'],
    recommendation: 'Good for racing thoughts',
  },
  body: {
    id: 'body',
    name: 'Body Tension',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="5" x2="8" y2="19"/><line x1="16" y1="5" x2="16" y2="19"/></svg>',
    cardLabel: 'Tight Body',
    cardHint: 'Tension in muscles or jaw',
    levels: ['Loose', 'Tight', 'Locked'],
    recommendation: 'Targets body tension',
  },
  breath: {
    id: 'breath',
    name: 'Breathing',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/></svg>',
    cardLabel: 'Shallow Breathing',
    cardHint: "Can't take a full breath",
    levels: ['Deep', 'Shallow', 'Stuck'],
    recommendation: 'Opens up your breathing',
  },
  pressure: {
    id: 'pressure',
    name: 'Internal Pressure',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="7,15 12,10 17,15"/><polyline points="7,19 12,14 17,19"/></svg>',
    cardLabel: 'Internal Pressure',
    cardHint: 'Restless or uneasy feeling',
    levels: ['Settled', 'Uneasy', 'Intense'],
    recommendation: 'Eases internal pressure',
  },
};

const SIGNAL_IDS = ['mind', 'body', 'breath', 'pressure'];

const appState = {
  currentView: 'home',
  currentExerciseId: null,
  player: null,
  preSignals: null,   // V4: { mind: 0-2, body: 0-2, breath: 0-2, pressure: 0-2 }
  postSignals: null,   // V4: same shape
  journalEntries: [],
  deferredPrompt: null,
  audioCtx: null,
  activeSignal: null,  // V4: which signal the user tapped on home screen
  practiceExerciseId: null, // V6: tracks if current exercise is the daily practice
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function $(id) {
  return document.getElementById(id);
}

function showToast(message, duration = 3000) {
  // Remove any existing toast
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function formatDateDisplay(dateStr) {
  const today = storage.getToday();
  if (dateStr === today) return 'Today';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  if (dateStr === yesterdayStr) return 'Yesterday';
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

// ============================================================================
// AUDIO CUES (Web Audio API — no files needed)
// ============================================================================

function getAudioCtx() {
  if (!appState.audioCtx) {
    appState.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return appState.audioCtx;
}

/** Play a gentle chime — frequency and duration define the tone */
function playChime(freq = 528, durationMs = 300, volume = 0.15) {
  const settings = storage.getSettings();
  if (!settings.sound) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch (e) {
    // Audio not available — silent fallback
  }
}

function playStepChime()    { playChime(528, 300, 0.12); }
function playCompleteChime(){ playChime(660, 500, 0.15); setTimeout(() => playChime(880, 400, 0.10), 250); }
function playInhaleChime()  { playChime(396, 200, 0.06); }
function playExhaleChime()  { playChime(264, 250, 0.06); }

// ============================================================================
// HAPTIC FEEDBACK (Vibration API — mobile only, graceful no-op on desktop)
// ============================================================================

function canVibrate() {
  return 'vibrate' in navigator;
}

/** Gentle tap — step transitions */
function hapticTap() {
  if (!canVibrate()) return;
  const settings = storage.getSettings();
  if (settings.reducedMotion) return;
  navigator.vibrate(15);
}

/** Soft double-pulse — completion */
function hapticComplete() {
  if (!canVibrate()) return;
  const settings = storage.getSettings();
  if (settings.reducedMotion) return;
  navigator.vibrate([30, 60, 30]);
}

/** Inhale rhythm — slow ramp-like pulse */
function hapticInhale() {
  if (!canVibrate()) return;
  const settings = storage.getSettings();
  if (settings.reducedMotion) return;
  navigator.vibrate([8, 40, 8, 40, 8]);
}

/** Exhale rhythm — single gentle pulse */
function hapticExhale() {
  if (!canVibrate()) return;
  const settings = storage.getSettings();
  if (settings.reducedMotion) return;
  navigator.vibrate(12);
}

/** Hold rhythm — very faint single pulse */
function hapticHold() {
  if (!canVibrate()) return;
  const settings = storage.getSettings();
  if (settings.reducedMotion) return;
  navigator.vibrate(5);
}

// ============================================================================
// THEME
// ============================================================================

function applyTheme(theme) {
  document.body.classList.remove('theme-light');
  if (theme === 'light') {
    document.body.classList.add('theme-light');
  } else if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (!prefersDark) document.body.classList.add('theme-light');
  }
  // Update meta theme-color
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const isLight = document.body.classList.contains('theme-light');
    meta.setAttribute('content', isLight ? '#f5f2ed' : '#1a1d21');
  }
}

// ============================================================================
// SERVICE WORKER & PWA
// ============================================================================

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

function setupPWAInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    appState.deferredPrompt = e;
    const installBtn = $('btn-install');
    if (installBtn) installBtn.style.display = 'block';
  });
  window.addEventListener('appinstalled', () => {
    appState.deferredPrompt = null;
    const installBtn = $('btn-install');
    if (installBtn) installBtn.style.display = 'none';
  });
  const installBtn = $('btn-install');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!appState.deferredPrompt) return;
      appState.deferredPrompt.prompt();
      await appState.deferredPrompt.userChoice;
      appState.deferredPrompt = null;
    });
  }
}

// ============================================================================
// NAVIGATION
// ============================================================================

function navigate(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = $(`view-${viewName}`);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  const tab = document.querySelector(`[data-view="${viewName}"]`);
  if (tab) tab.classList.add('active');

  const nav = $('bottom-nav');
  if (nav) nav.style.display = viewName === 'player' ? 'none' : 'flex';

  appState.currentView = viewName;

  if (viewName === 'home')     initHome();
  if (viewName === 'library')  initLibrary();
  if (viewName === 'journal')  initJournal();
  if (viewName === 'history')  initHistory();
  if (viewName === 'settings') initSettings();
}

function setupNavigation() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => navigate(tab.getAttribute('data-view')));
  });
  window.addEventListener('hashchange', () => {
    const hash = location.hash.slice(1);
    if (hash.startsWith('player/')) {
      startExercise(hash.split('/')[1]);
    } else if (hash) {
      navigate(hash);
    }
  });
}

// ============================================================================
// V6: RELIEF EXERCISE RECOMMENDATIONS
// ============================================================================

/**
 * Find the best relief exercise for a given signal.
 * Scores by signal match, personal effectiveness data, and evidence level.
 */
function getReliefRecommendation(signalId) {
  const reliefExercises = getReliefExercises();
  const todaySessions = storage.getTodaySessions();
  const usedIds = new Set(todaySessions.map(s => s.exerciseId));
  const signalEff = storage.getSignalEffectiveness(90);

  const scored = reliefExercises.map(ex => {
    let score = 0;
    let reason = '';

    // Signal match (primary criterion)
    if (ex.signals && ex.signals.includes(signalId)) {
      score += 5;
      reason = SIGNALS[signalId].recommendation;
    }

    // Personal effectiveness for this signal
    const sigData = signalEff.get(ex.id);
    if (sigData && sigData.count >= 2 && sigData[signalId] > 0.5) {
      score += 4;
      reason = `Your best tool for ${SIGNALS[signalId].name.toLowerCase()}`;
    }

    // Prefer strong evidence
    if (ex.evidenceLevel === 'strong') score += 2;
    if (ex.evidenceLevel === 'moderate') score += 1;

    // Slight penalty for already-used-today
    if (usedIds.has(ex.id)) score -= 1;

    // Boost favorites
    if (storage.isFavorite(ex.id)) score += 1;

    return { exercise: ex, score, reason: reason || 'Recommended for you' };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0] || null;
}

// ============================================================================
// HOME VIEW
// ============================================================================

function initHome() {
  const time = getTimeOfDay();
  const tagline = $('home-tagline');
  if (tagline) {
    const lines = { morning: 'Build your baseline.', afternoon: 'Train your resilience.', evening: 'Wind down stronger.' };
    tagline.textContent = lines[time] || 'Train your resilience.';
  }

  renderPracticeCard();
  setupSignalGrid();
  renderInsightCards();

  const btnEmergency = $('btn-emergency');
  if (btnEmergency) btnEmergency.onclick = () => startExercise('physiological-sigh');

  updateRecentExercises();
}

// ============================================================================
// V6: DAILY PRACTICE CARD
// ============================================================================

function getDailyPractice() {
  // Select today's training exercise
  const trainingExercises = getTrainingExercises();
  const recentIds = storage.getRecentPracticeIds(5);
  const today = storage.getToday();

  // Deterministic daily rotation: use day-of-year as seed
  const dayOfYear = Math.floor((new Date(today) - new Date(new Date().getFullYear(), 0, 0)) / 86400000);

  // Filter out recently practiced exercises to add variety
  let candidates = trainingExercises.filter(ex => !recentIds.includes(ex.id));
  if (candidates.length === 0) candidates = trainingExercises; // fallback if all recently used

  // Pick exercise based on day rotation
  const idx = dayOfYear % candidates.length;
  return candidates[idx];
}

const PRACTICE_REASONS = {
  'resonant-breathing': 'Trains your nervous system to shift into recovery mode.',
  'extended-exhale': 'Builds breath control — your fastest lever against stress.',
  'pmr-short': 'Teaches your body the difference between tension and release.',
  'name-the-story': 'Builds the skill of watching thoughts without believing them.',
  'leaves-on-stream': 'Trains sustained attention — the foundation of resilience.',
  'orienting-response': 'Teaches your nervous system that the environment is safe.',
  'pendulation': 'Builds nervous system flexibility — the core of resilience.',
  'tremor-release': 'Releases stored tension your body is holding from stress.',
  'box-breathing': 'Trains controlled breathing under any conditions.',
  'body-scan': 'Builds body awareness — notice stress before it builds.',
  'cold-exposure-breathing': 'Builds stress tolerance by training controlled activation.',
};

function renderPracticeCard() {
  const body = $('practice-body');
  const streakEl = $('practice-streak');
  const btn = $('btn-practice');
  const card = $('practice-card');
  if (!body || !btn || !card) return;

  const todayPractice = storage.getTodayPractice();
  const practiceStreak = storage.getPracticeStreak();

  // Show streak
  if (streakEl) {
    if (practiceStreak.current > 0) {
      streakEl.textContent = `${practiceStreak.current} day streak`;
    } else {
      streakEl.textContent = '';
    }
  }

  if (todayPractice.completed) {
    // Already done today
    const ex = getExercise(todayPractice.exerciseId);
    card.classList.add('completed');
    body.innerHTML = `
      <div class="practice-title">${ex ? ex.title : 'Practice'}</div>
      <div class="practice-done">Done for today.</div>
    `;
    btn.textContent = 'Completed';
    btn.disabled = true;
  } else {
    // Select today's exercise
    const ex = getDailyPractice();
    card.classList.remove('completed');
    const reason = PRACTICE_REASONS[ex.id] || 'Builds regulation skill over time.';
    body.innerHTML = `
      <div class="practice-title">${ex.title}</div>
      <div class="practice-meta">${formatDuration(ex.duration)}</div>
      <div class="practice-reason">${reason}</div>
    `;
    btn.textContent = 'Begin Practice';
    btn.disabled = false;
    btn.onclick = () => {
      appState.practiceExerciseId = ex.id;
      startExercise(ex.id);
    };
  }
}

function setupSignalGrid() {
  const grid = $('signal-grid');
  if (!grid) return;

  // Restore today's check-in if exists
  const checkIn = storage.getTodayCheckIn();
  if (checkIn && checkIn.primarySignal) {
    appState.activeSignal = checkIn.primarySignal;
    grid.querySelectorAll('.signal-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.signal === checkIn.primarySignal);
    });
    // Show recommendation for restored signal
    showReliefRecommendation(checkIn.primarySignal);
  }

  grid.querySelectorAll('.signal-card').forEach(card => {
    card.addEventListener('click', () => {
      const signal = card.dataset.signal;
      // Toggle selection
      grid.querySelectorAll('.signal-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      appState.activeSignal = signal;
      hapticTap();

      // Save check-in
      storage.saveCheckIn(signal);

      // Show inline relief recommendation
      showReliefRecommendation(signal);
    });
  });
}

/**
 * V6: Show a relief exercise recommendation inline below the signal grid.
 */
function showReliefRecommendation(signalId) {
  const container = $('relief-recommendation');
  if (!container) return;

  const rec = getReliefRecommendation(signalId);
  if (!rec) {
    container.style.display = 'none';
    return;
  }

  const ex = rec.exercise;
  container.style.display = 'block';
  container.innerHTML = `
    <div class="relief-rec-card" data-exercise-id="${ex.id}">
      <div class="relief-rec-indicator" data-category="${ex.category}"></div>
      <div class="relief-rec-body">
        <div class="relief-rec-title">${ex.title}</div>
        <div class="relief-rec-meta">${formatDuration(ex.duration)} · ${rec.reason}</div>
      </div>
      <button class="btn btn-primary btn-small relief-rec-start">Start</button>
    </div>`;

  // Wire up click
  const card = container.querySelector('.relief-rec-card');
  if (card) card.addEventListener('click', () => startExercise(ex.id));
}

function updateRecentExercises() {
  const list = $('recent-list');
  const section = $('recent-section');
  if (!list || !section) return;
  const top = storage.getMostUsedExercises(30).slice(0, 3);
  if (top.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  list.innerHTML = top.map(item => {
    const ex = getExercise(item.exerciseId);
    if (!ex) return '';
    return `<div class="recent-card" data-exercise-id="${ex.id}" data-category="${ex.category}">
      <div class="recent-indicator"></div>
      <div class="recent-info">
        <div class="recent-title">${ex.title}</div>
        <div class="recent-meta">${item.count}x${item.avgReduction > 0 ? ` · ${item.avgReduction.toFixed(1)} point relief` : ''}</div>
      </div></div>`;
  }).join('');
  list.querySelectorAll('.recent-card').forEach(c => {
    c.addEventListener('click', () => startExercise(c.dataset.exerciseId));
  });
}

// ============================================================================
// V5: INSIGHT CARDS
// ============================================================================

function renderInsightCards() {
  const container = $('insight-cards');
  if (!container) return;

  // Build data object for insight engine
  const data = {
    checkInHistory: storage.getCheckInHistory(14),
    recentSessions: storage.getRecentSessions(30),
    signalEffectiveness: storage.getSignalEffectiveness(90),
    streak: storage.getStreak(),
    activeSignal: appState.activeSignal,
    exercises,
  };

  const insightResults = getInsights(data);

  if (insightResults.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = insightResults.map(r => r.html).join('');
  wireInsightActions(container);
}

function wireInsightActions(container) {
  // Dismiss buttons
  container.querySelectorAll('.insight-dismiss').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.insight-card');
      const insightId = card?.dataset.insight;
      if (insightId) {
        card.classList.add('dismissing');
        setTimeout(() => {
          storage.dismissInsight(insightId);
          renderInsightCards();
        }, 300);
      }
    });
  });

  // Action links
  container.querySelectorAll('.insight-action').forEach(link => {
    link.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = link.dataset.action;

      if (action === 'select-signal') {
        const signal = link.dataset.signal;
        if (signal) {
          appState.activeSignal = signal;
          storage.saveCheckIn(signal);
          const grid = $('signal-grid');
          if (grid) {
            grid.querySelectorAll('.signal-card').forEach(c => {
              c.classList.toggle('selected', c.dataset.signal === signal);
            });
          }
          showRecommendation();
          // Scroll to recommendation
          const recCard = $('recommendation-card');
          if (recCard) recCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      if (action === 'start-exercise') {
        const exerciseId = link.dataset.exercise;
        if (exerciseId) startExercise(exerciseId);
      }

      if (action === 'dismiss-weekly') {
        const card = link.closest('.insight-card');
        if (card) {
          card.classList.add('dismissing');
          setTimeout(() => {
            // The weekly summary insight's action() handles the dismissal in storage
            const weekOf = getISOWeekString();
            storage.dismissWeeklySummary(weekOf);
            renderInsightCards();
          }, 300);
        }
      }
    });
  });

  // Card click (for signal trend — tap to select signal)
  container.querySelectorAll('.insight-card[data-signal]').forEach(card => {
    card.addEventListener('click', () => {
      const signal = card.dataset.signal;
      if (signal) {
        appState.activeSignal = signal;
        storage.saveCheckIn(signal);
        showRecommendation();
      }
    });
  });

  // Card click for best tool — tap to start exercise
  container.querySelectorAll('.insight-card[data-exercise]').forEach(card => {
    card.addEventListener('click', () => {
      const exerciseId = card.dataset.exercise;
      if (exerciseId) startExercise(exerciseId);
    });
  });
}

function getISOWeekString() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// ============================================================================
// LIBRARY VIEW (with favorites)
// ============================================================================

function initLibrary() {
  setupCategoryFilters();
  populateExerciseList('all');
}

function setupCategoryFilters() {
  const pills = document.querySelectorAll('.category-pills .pill');
  pills.forEach(pill => {
    pill.onclick = () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      populateExerciseList(pill.dataset.category);
    };
  });
}

function populateExerciseList(category) {
  const list = $('exercise-list');
  if (!list) return;

  let filtered = exercises;
  if (category === 'favorites') {
    const favs = storage.getFavorites();
    filtered = exercises.filter(ex => favs.includes(ex.id));
    if (filtered.length === 0) {
      list.innerHTML = '<p class="empty-state">No saved exercises yet. Tap the bookmark on any exercise to save it here.</p>';
      return;
    }
  } else if (category === 'training') {
    filtered = getTrainingExercises();
  } else if (category === 'relief') {
    filtered = getReliefExercises();
  } else if (category !== 'all') {
    filtered = getExercisesByCategory(category);
  }

  list.innerHTML = filtered.map(ex => {
    const isFav = storage.isFavorite(ex.id);
    return `<div class="exercise-card" data-exercise-id="${ex.id}" data-category="${ex.category}">
      <div class="exercise-card-icon">${ex.icon}</div>
      <div class="exercise-card-body">
        <h3>${ex.title}</h3>
        <p>${ex.subtitle}</p>
        <div class="exercise-card-meta">
          <span class="duration-badge">${formatDuration(ex.duration)}</span>
          <span class="evidence-badge evidence-${ex.evidenceLevel}">${ex.evidenceLevel}</span>
        </div>
      </div>
      <button class="fav-btn ${isFav ? 'favorited' : ''}" data-fav-id="${ex.id}" aria-label="Toggle favorite">${isFav ? '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5"><path d="M5 4h14v16l-7-4-7 4V4z"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 4h14v16l-7-4-7 4V4z"/></svg>'}</button>
    </div>`;
  }).join('');

  // Card click → start exercise (but not if clicking fav button)
  list.querySelectorAll('.exercise-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.fav-btn')) return;
      startExercise(card.dataset.exerciseId);
    });
  });

  // Fav button click
  list.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.favId;
      const nowFav = storage.toggleFavorite(id);
      btn.innerHTML = nowFav ? '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5"><path d="M5 4h14v16l-7-4-7 4V4z"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 4h14v16l-7-4-7 4V4z"/></svg>';
      btn.classList.toggle('favorited', nowFav);
      showToast(nowFav ? 'Added to favorites' : 'Removed from favorites', 1500);
    });
  });
}

// ============================================================================
// PLAYER VIEW
// ============================================================================

function startExercise(exerciseId) {
  const exercise = getExercise(exerciseId);
  if (!exercise) return;
  appState.currentExerciseId = exerciseId;
  appState.preSignals = null;
  appState.postSignals = null;
  appState.journalEntries = [];
  navigate('player');
  setupPlayerView(exercise);
}

function setupPlayerView(exercise) {
  const titleEl = $('player-title');
  if (titleEl) titleEl.textContent = exercise.title;

  const pre = $('player-pre'), main = $('player-main'), post = $('player-post');
  if (pre)  pre.style.display  = 'block';
  if (main) main.style.display = 'none';
  if (post) post.style.display = 'none';

  setupPreStateCheck();
  setupPlayerStartButton(exercise);
  setupPlayerBackButton();

  const timer = $('player-timer');
  if (timer) timer.textContent = '0:00';
}

/**
 * V4/V5: Wire up signal-level buttons in the pre-exercise state check.
 * V5: Smart defaults based on home screen signal selection or recent session data.
 */
function setupPreStateCheck() {
  const container = $('state-check-pre');
  if (!container) return;

  // V5: Smart defaults
  const defaults = getSmartDefaults();

  container.querySelectorAll('.signal-row').forEach(row => {
    const sig = row.dataset.signal;
    const defaultLevel = defaults[sig] !== undefined ? defaults[sig] : 1;
    row.querySelectorAll('.signal-level').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.level) === defaultLevel);
    });
  });

  // Attach click handlers
  container.querySelectorAll('.signal-level').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.signal-row');
      row.querySelectorAll('.signal-level').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      hapticTap();
    });
  });
}

/**
 * V5: Compute smart defaults for pre-exercise state check.
 * Priority 1: Home screen signal selection → that signal = 2, others = 1
 * Priority 2: Most recent today session's signalsAfter (continuation)
 * Priority 3: All moderate (current V4 behavior)
 */
function getSmartDefaults() {
  // Priority 1: Home screen signal selection
  if (appState.activeSignal) {
    const defaults = { mind: 1, body: 1, breath: 1, pressure: 1 };
    defaults[appState.activeSignal] = 2;
    return defaults;
  }

  // Priority 2: Most recent session's signalsAfter (continuation)
  const todaySessions = storage.getTodaySessions();
  if (todaySessions.length > 0) {
    const last = todaySessions[todaySessions.length - 1];
    if (last.signalsAfter) return { ...last.signalsAfter };
  }

  // Priority 3: Default all to moderate
  return { mind: 1, body: 1, breath: 1, pressure: 1 };
}

/**
 * V4: Read signal levels from a state-check container
 * @param {string} containerId - ID of the state-check element
 * @returns {Object} { mind: 0-2, body: 0-2, breath: 0-2, pressure: 0-2 }
 */
function readSignalLevels(containerId) {
  const container = $(containerId);
  if (!container) return { mind: 1, body: 1, breath: 1, pressure: 1 };
  const signals = {};
  container.querySelectorAll('.signal-row').forEach(row => {
    const sig = row.dataset.signal;
    const selected = row.querySelector('.signal-level.selected');
    signals[sig] = selected ? parseInt(selected.dataset.level) : 1;
  });
  return signals;
}

function setupPlayerStartButton(exercise) {
  const startBtn = $('player-start-btn');
  if (!startBtn) return;
  startBtn.onclick = () => {
    // Read pre-exercise signal levels
    appState.preSignals = readSignalLevels('state-check-pre');
    const pre = $('player-pre'), main = $('player-main');
    if (pre)  pre.style.display  = 'none';
    if (main) main.style.display = 'block';
    initializePlayer(exercise);
  };
}

function initializePlayer(exercise) {
  if (appState.player) appState.player.stop();

  appState.player = createPlayer({
    onStepChange: (step, index, total) => {
      handleStepChange(step, index, total, exercise);
      // Audio cue on step change
      if (step.type === 'breathe-in')       playInhaleChime();
      else if (step.type === 'breathe-out') playExhaleChime();
      else                                  playStepChime();
    },
    onTick: (elapsed, stepElapsed, stepDuration) => {
      handleTick(elapsed, stepElapsed, stepDuration, exercise);
    },
    onComplete: () => {
      playCompleteChime();
      hapticComplete();
      handleComplete(exercise);
    },
  });

  setupPlayerControls();

  if (exercise.id === 'stress-journal') {
    setupJournalExerciseMode(exercise);
  } else {
    const ji = $('journal-inputs');
    if (ji) ji.style.display = 'none';
  }

  appState.player.start(exercise);
}

function handleStepChange(step, index, total, exercise) {
  const instrEl = $('player-instruction');
  const progText = $('progress-text');
  const circleWrap = $('breath-circle-wrap');
  const circle = $('breath-circle');
  const label = $('breath-label');
  const stepIndicator = $('step-indicator');

  // === V3: Narration layer — animated text transitions ===
  if (instrEl) {
    // Fade out → update text → fade in
    instrEl.classList.add('narration-exit');
    setTimeout(() => {
      instrEl.textContent = step.instruction;
      instrEl.classList.remove('narration-exit');
      instrEl.classList.add('narration-enter');
      setTimeout(() => instrEl.classList.remove('narration-enter'), 400);
    }, 200);
  }

  if (progText) progText.textContent = `Step ${index + 1} of ${total}`;

  // === V3: Step progress dots indicator ===
  if (stepIndicator) {
    const maxDots = Math.min(total, 12); // cap visual dots
    const dotRatio = total > 12 ? index / (total - 1) : null;
    let dotsHtml = '';
    for (let i = 0; i < maxDots; i++) {
      const isActive = dotRatio !== null
        ? (i / (maxDots - 1)) <= dotRatio
        : i <= index;
      dotsHtml += `<span class="step-dot ${isActive ? 'active' : ''} ${i === (dotRatio !== null ? Math.round(dotRatio * (maxDots - 1)) : index) ? 'current' : ''}"></span>`;
    }
    stepIndicator.innerHTML = dotsHtml;
  }

  // === V3: Haptic feedback on step transitions ===
  if (step.type === 'breathe-in') {
    hapticInhale();
  } else if (step.type === 'breathe-out') {
    hapticExhale();
  } else if (step.type === 'hold') {
    hapticHold();
  } else {
    hapticTap();
  }

  // Breathing animation
  if (exercise.id !== 'stress-journal') {
    if (step.type.startsWith('breathe') || step.type === 'hold') {
      if (circleWrap) circleWrap.style.display = 'block';
      if (circle) {
        circle.classList.remove('inhale', 'exhale', 'hold');
        if (step.type === 'breathe-in')       { circle.classList.add('inhale');  if (label) label.textContent = 'Breathe In'; }
        else if (step.type === 'breathe-out') { circle.classList.add('exhale');  if (label) label.textContent = 'Breathe Out'; }
        else if (step.type === 'hold')        { circle.classList.add('hold');    if (label) label.textContent = 'Hold'; }
      }
    } else {
      if (circleWrap) circleWrap.style.display = 'none';
    }
  }

  // === V3: Step type visual hint (shown below instruction for non-breathing) ===
  const typeHint = $('step-type-hint');
  if (typeHint && exercise.id !== 'stress-journal') {
    if (step.type === 'prompt') {
      typeHint.textContent = 'Take your time';
      typeHint.style.display = 'block';
    } else if (step.type === 'repeat') {
      typeHint.textContent = 'Continue at your own pace';
      typeHint.style.display = 'block';
    } else if (step.duration && step.duration >= 10) {
      typeHint.textContent = `${step.duration}s`;
      typeHint.style.display = 'block';
    } else {
      typeHint.style.display = 'none';
    }
  }

  // User-paced steps: show Next button
  if (step.duration === null && step.type !== 'repeat') {
    const controls = $('player-controls');
    if (controls && !controls.querySelector('.next-btn')) {
      const nb = document.createElement('button');
      nb.className = 'btn btn-primary next-btn';
      nb.textContent = 'Next →';
      nb.addEventListener('click', () => appState.player.skip());
      controls.appendChild(nb);
    }
  } else {
    const nb = document.querySelector('.next-btn');
    if (nb) nb.remove();
  }
}

function handleTick(elapsed, stepElapsed, stepDuration, exercise) {
  const timer = $('player-timer');
  if (timer) timer.textContent = formatTime(elapsed);
  const fill = $('progress-fill');
  if (fill && exercise.duration) {
    fill.style.width = `${Math.min((elapsed / exercise.duration) * 100, 100)}%`;
  }
}

function handleComplete(exercise) {
  const main = $('player-main'), post = $('player-post');
  if (main) main.style.display = 'none';
  if (post) post.style.display = 'block';

  // V4: Generate post-exercise state check — only show elevated signals
  generatePostStateCheck();

  const saveBtn = $('player-save');
  const skipBtn = $('player-skip-save');

  if (saveBtn) {
    saveBtn.onclick = () => {
      const state = appState.player.getState();
      // Read post-exercise signal levels
      appState.postSignals = readSignalLevels('state-check-post');

      // Fill in non-elevated signals with their pre values (unchanged)
      if (appState.preSignals) {
        SIGNAL_IDS.forEach(sig => {
          if (appState.postSignals[sig] === undefined) {
            appState.postSignals[sig] = appState.preSignals[sig];
          }
        });
      }

      storage.saveSession(exercise.id, {
        signalsBefore: appState.preSignals,
        signalsAfter: appState.postSignals,
        completed: true,
        duration: state.elapsed,
      });
      if (exercise.id === 'stress-journal' && appState.journalEntries.length > 0) {
        appState.journalEntries.forEach(e => storage.saveJournalEntry(e));
      }
      // V6: If this was the daily practice exercise, mark practice as completed
      if (appState.practiceExerciseId && exercise.id === appState.practiceExerciseId) {
        storage.completePractice(exercise.id);
        appState.practiceExerciseId = null;
      }

      // V5: Show exercise report card if enough data, otherwise shift toast + navigate
      const reportShown = showExerciseReport(exercise.id, appState.preSignals, appState.postSignals);
      if (!reportShown) {
        showShiftToast(appState.preSignals, appState.postSignals);
        navigate('home');
      }
    };
  }
  if (skipBtn) { skipBtn.onclick = () => navigate('home'); }
}

/**
 * V4: Generate post-exercise state check with only elevated signals
 */
function generatePostStateCheck() {
  const container = $('state-check-post');
  if (!container || !appState.preSignals) return;

  // Find elevated signals (level >= 1)
  const elevated = SIGNAL_IDS.filter(sig => appState.preSignals[sig] >= 1);

  if (elevated.length === 0) {
    // All signals were calm — simple confirmation
    container.innerHTML = `
      <div class="all-calm-msg">
        <span class="calm-emoji">—</span>
        <p>Still feeling good?</p>
      </div>`;
    return;
  }

  let html = '<h3 class="state-check-title">How do you feel now?</h3>';
  elevated.forEach(sig => {
    const info = SIGNALS[sig];
    const preLvl = appState.preSignals[sig];
    const defaultPost = Math.max(0, preLvl - 1); // nudge one level lower
    html += `
      <div class="signal-row" data-signal="${sig}">
        <div class="signal-row-label">${info.icon} ${info.name}</div>
        <div class="signal-was">Was: ${info.levels[preLvl]}</div>
        <div class="signal-levels">
          ${info.levels.map((label, lvl) =>
            `<button class="signal-level ${lvl === defaultPost ? 'selected' : ''}" data-level="${lvl}">${label}</button>`
          ).join('')}
        </div>
      </div>`;
  });
  container.innerHTML = html;

  // Wire up click handlers
  container.querySelectorAll('.signal-level').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.signal-row');
      row.querySelectorAll('.signal-level').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      hapticTap();
    });
  });
}

/**
 * V4: Show a shift summary toast after saving
 */
function showShiftToast(pre, post) {
  if (!pre || !post) { showToast('Session saved!'); return; }
  const shifts = [];
  SIGNAL_IDS.forEach(sig => {
    const before = pre[sig] || 0;
    const after = post[sig] || 0;
    if (before > after) {
      shifts.push(`${SIGNALS[sig].name}: ${SIGNALS[sig].levels[before]} → ${SIGNALS[sig].levels[after]}`);
    }
  });
  if (shifts.length > 0) {
    showToast(shifts.join(' · '), 4000);
  } else {
    showToast('Session saved!');
  }
}

/**
 * V5: Show exercise report card overlay after saving a session.
 * Returns true if the report was shown, false if data threshold not met.
 */
function showExerciseReport(exerciseId, preSignals, postSignals) {
  const data = {
    recentSessions: storage.getRecentSessions(90),
    signalEffectiveness: storage.getSignalEffectiveness(90),
    exercises,
  };

  const report = getExerciseReport(exerciseId, preSignals, postSignals, data);
  if (!report) return false;

  // Build overlay
  const overlay = document.createElement('div');
  overlay.className = 'exercise-report-overlay';

  let shiftsHtml = '';
  if (report.shifts.length > 0) {
    shiftsHtml = '<div class="report-shifts">' +
      report.shifts.map(s =>
        `<div class="report-shift-line">${s.name}: ${s.before} <span class="shift-arrow">→</span> ${s.after}</div>`
      ).join('') +
      '</div>';
  }

  let contextHtml = '<div class="report-context">';
  contextHtml += `<p>This is your ${ordinal(report.sessionCount)} time doing this exercise.</p>`;
  if (report.bestSignalInsight) {
    contextHtml += `<p>${report.bestSignalInsight}.</p>`;
  }
  contextHtml += '</div>';

  overlay.innerHTML = `<div class="exercise-report-card">
    <h3>${report.exerciseName}</h3>
    ${shiftsHtml}
    ${contextHtml}
    <button class="btn btn-primary" id="report-done-btn">Done</button>
  </div>`;

  document.body.appendChild(overlay);

  // Auto-dismiss after 3 seconds or on tap
  const dismiss = () => {
    if (overlay.parentNode) {
      overlay.remove();
      navigate('home');
    }
  };

  const timer = setTimeout(dismiss, 3000);

  const doneBtn = overlay.querySelector('#report-done-btn');
  if (doneBtn) {
    doneBtn.addEventListener('click', () => {
      clearTimeout(timer);
      dismiss();
    });
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      clearTimeout(timer);
      dismiss();
    }
  });

  return true;
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function setupPlayerControls() {
  const pauseBtn = $('player-pause');
  const restartBtn = $('player-restart');
  const skipBtn = $('player-skip');

  if (pauseBtn) {
    pauseBtn.onclick = () => {
      if (appState.player.isPaused()) { appState.player.resume(); pauseBtn.textContent = 'Pause'; }
      else                            { appState.player.pause();  pauseBtn.textContent = 'Resume'; }
    };
  }
  if (restartBtn) {
    restartBtn.onclick = () => {
      appState.player.restart();
      const p = $('player-pause');
      if (p) p.textContent = 'Pause';
    };
  }
  if (skipBtn) { skipBtn.onclick = () => appState.player.skip(); }
}

function setupPlayerBackButton() {
  const btn = $('player-back');
  if (btn) btn.onclick = () => { if (appState.player) appState.player.stop(); navigate('home'); };
}

function setupJournalExerciseMode(exercise) {
  const ji = $('journal-inputs');
  const ta = $('journal-textarea');
  const nb = $('journal-next');
  if (ji) ji.style.display = 'block';
  if (nb) {
    nb.onclick = () => {
      const text = ta?.value.trim();
      if (!text) { showToast('Please write something'); return; }
      const state = appState.player.getState();
      const labels = ['stressor', 'inControl', 'nextStep'];
      const label = labels[state.stepIndex] || `field_${state.stepIndex}`;
      appState.journalEntries[state.stepIndex] = { field: label, value: text };
      if (ta) ta.value = '';
      appState.player.skip();
    };
  }
}

// ============================================================================
// JOURNAL VIEW
// ============================================================================

function initJournal() {
  const saveBtn = $('journal-save');
  if (saveBtn) {
    saveBtn.onclick = () => {
      const stressor = $('journal-stressor')?.value.trim();
      const inControl = $('journal-control')?.value.trim();
      const nextStep = $('journal-nextstep')?.value.trim();
      if (!stressor || !inControl || !nextStep) { showToast('Please fill in all fields'); return; }
      try {
        storage.saveJournalEntry({ stressor, inControl, nextStep });
        if ($('journal-stressor')) $('journal-stressor').value = '';
        if ($('journal-control'))  $('journal-control').value = '';
        if ($('journal-nextstep')) $('journal-nextstep').value = '';
        showToast('Entry saved');
        loadJournalEntries();
      } catch (err) { showToast(`Error: ${err.message}`); }
    };
  }
  loadJournalEntries();
}

function loadJournalEntries() {
  const list = $('journal-entries-list');
  if (!list) return;
  const entries = storage.getJournalEntries(30);
  if (entries.length === 0) {
    list.innerHTML = '<p class="empty-state">No entries yet.</p>';
    return;
  }
  list.innerHTML = entries.map(e => `
    <div class="journal-entry-card">
      <div class="entry-date">${formatDateDisplay(e.date)}</div>
      <div class="entry-field"><span class="field-label">Stressor:</span><p>${escapeHtml(e.stressor)}</p></div>
      <div class="entry-field"><span class="field-label">In Control:</span><p>${escapeHtml(e.inControl)}</p></div>
      <div class="entry-field"><span class="field-label">Next Step:</span><p>${escapeHtml(e.nextStep)}</p></div>
    </div>`).join('');
}

// ============================================================================
// HISTORY VIEW (with weekly chart + share)
// ============================================================================

function initHistory() {
  updateHistoryStats();
  renderSignalChart();
  renderWeeklyChart();
  populateRecentSessions();
  populateMostHelpful();
  setupShareButton();
}

/**
 * V5: Render the 14-day signal history chart
 */
function renderSignalChart() {
  const container = $('signal-chart');
  if (!container) return;

  const sessions = storage.getRecentSessions(14);
  const chartData = getSignalChartData(sessions);

  if (!chartData.hasData) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';

  const signalLabels = {
    mind: 'Mind',
    body: 'Body',
    breath: 'Breath',
    pressure: 'Pressure',
  };

  // Build grid HTML
  // Row 0: empty corner + day labels
  let html = '<h3>Signal Trends (Last 2 Weeks)</h3><div class="signal-chart-grid">';

  // Header row: empty corner + 14 day labels
  html += '<div class="signal-chart-label"></div>';
  chartData.days.forEach(day => {
    html += `<div class="signal-chart-day-label">${day.dayLabel}</div>`;
  });

  // One row per signal
  SIGNAL_IDS.forEach(sig => {
    html += `<div class="signal-chart-label">${signalLabels[sig]}</div>`;
    chartData.days.forEach(day => {
      const level = day.signals[sig];
      const cls = level === -1 ? 'level-none' : `level-${level}`;
      html += `<div class="signal-dot ${cls}"></div>`;
    });
  });

  html += '</div>';
  container.innerHTML = html;
}

function updateHistoryStats() {
  const grid = $('stats-grid');
  if (!grid) return;
  const practiceStreak = storage.getPracticeStreak();
  const weekly = storage.getRecentSessions(7);
  const allRecent = storage.getRecentSessions(30);

  // Count training vs relief sessions
  let trainingCount = 0, reliefCount = 0;
  allRecent.forEach(s => {
    const ex = getExercise(s.exerciseId);
    if (ex) {
      if (ex.mode === 'training' || ex.mode === 'both') trainingCount++;
      if (ex.mode === 'relief' || ex.mode === 'both') reliefCount++;
    }
  });

  grid.innerHTML = `
    <div class="stat-card"><div class="stat-label">Practice Streak</div><div class="stat-value">${practiceStreak.current}</div><div class="stat-unit">days</div></div>
    <div class="stat-card"><div class="stat-label">This Week</div><div class="stat-value">${weekly.length}</div><div class="stat-unit">sessions</div></div>
    <div class="stat-card"><div class="stat-label">Training</div><div class="stat-value">${trainingCount}</div><div class="stat-unit">last 30 days</div></div>
    <div class="stat-card"><div class="stat-label">Longest Streak</div><div class="stat-value">${practiceStreak.longest}</div><div class="stat-unit">days</div></div>`;
}

function renderWeeklyChart() {
  const container = $('chart-bars');
  if (!container) return;
  const sessions = storage.getRecentSessions(7);
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = sessions.filter(s => s.date === dateStr).length;
    days.push({ label: dayNames[d.getDay()], count, isToday: i === 0 });
  }

  const maxCount = Math.max(...days.map(d => d.count), 1);

  container.innerHTML = days.map(d => {
    const height = d.count > 0 ? Math.max((d.count / maxCount) * 80, 8) : 4;
    const cls = d.count === 0 ? 'empty' : (d.isToday ? 'today' : '');
    return `<div class="chart-day">
      ${d.count > 0 ? `<span class="chart-value">${d.count}</span>` : ''}
      <div class="chart-bar ${cls}" style="height:${height}px;"></div>
      <span class="chart-label">${d.label}</span>
    </div>`;
  }).join('');
}

function populateRecentSessions() {
  const list = $('history-list');
  if (!list) return;
  const sessions = storage.getRecentSessions(30);
  if (sessions.length === 0) {
    list.innerHTML = '<p class="empty-state">No sessions yet.</p>';
    return;
  }
  list.innerHTML = sessions.slice().reverse().map(s => {
    const ex = getExercise(s.exerciseId);
    if (!ex) return '';
    // V4: show most-improved signal shift, fall back to legacy numbers
    let shiftText = '';
    if (s.signalsBefore && s.signalsAfter) {
      let bestSig = null, bestDrop = 0;
      SIGNAL_IDS.forEach(sig => {
        const drop = (s.signalsBefore[sig] || 0) - (s.signalsAfter[sig] || 0);
        if (drop > bestDrop) { bestDrop = drop; bestSig = sig; }
      });
      if (bestSig) {
        shiftText = `${SIGNALS[bestSig].icon} ${SIGNALS[bestSig].levels[s.signalsBefore[bestSig]]} → ${SIGNALS[bestSig].levels[s.signalsAfter[bestSig]]}`;
      }
    } else if (typeof s.stressBefore === 'number') {
      shiftText = `${s.stressBefore} → ${s.stressAfter}`;
    }
    return `<div class="history-item" data-category="${ex.category}">
      <div class="history-indicator"></div>
      <div class="history-info"><div class="history-title">${ex.title}</div><div class="history-date">${formatDateDisplay(s.date)}</div></div>
      <div class="history-stress">${shiftText}</div>
    </div>`;
  }).join('');
}

function populateMostHelpful() {
  const list = $('most-helpful-list');
  if (!list) return;
  const most = storage.getMostUsedExercises(30);
  const signalEff = storage.getSignalEffectiveness(90);
  if (most.length === 0) {
    list.innerHTML = '<p class="empty-state">Track sessions to see what works best.</p>';
    return;
  }
  list.innerHTML = most.map(item => {
    const ex = getExercise(item.exerciseId);
    if (!ex) return '';
    // V4: Show best signal-specific insight if available
    let statsText = `${item.count}x${item.avgReduction > 0 ? ` · ${item.avgReduction.toFixed(1)} avg relief` : ''}`;
    const sigData = signalEff.get(item.exerciseId);
    if (sigData && sigData.count >= 2) {
      let bestSig = null, bestAvg = 0;
      SIGNAL_IDS.forEach(sig => {
        if (sigData[sig] > bestAvg) { bestAvg = sigData[sig]; bestSig = sig; }
      });
      if (bestSig && bestAvg > 0.3) {
        statsText = `${item.count}x • Best for ${SIGNALS[bestSig].name.toLowerCase()}`;
      }
    }
    return `<div class="most-helpful-card" data-exercise-id="${ex.id}" data-category="${ex.category}">
      <div class="helpful-indicator"></div>
      <div class="helpful-info"><div class="helpful-title">${ex.title}</div>
      <div class="helpful-stats">${statsText}</div></div>
    </div>`;
  }).join('');
  list.querySelectorAll('.most-helpful-card').forEach(c => {
    c.addEventListener('click', () => startExercise(c.dataset.exerciseId));
  });
}

// ============================================================================
// SHARE PROGRESS (canvas-based image export)
// ============================================================================

function setupShareButton() {
  const btn = $('btn-share-progress');
  if (!btn) return;
  btn.onclick = async () => {
    try {
      const canvas = generateProgressImage();
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

      // Try native share if available
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], 'steady-progress.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'My Steady Progress' });
          return;
        }
      }

      // Fallback: download the image
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'steady-progress.png';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Progress image saved');
    } catch (e) {
      if (e.name !== 'AbortError') showToast('Could not share');
    }
  };
}

function generateProgressImage() {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#1a1d21';
  ctx.fillRect(0, 0, 600, 400);

  // Title
  ctx.fillStyle = '#e2dfd9';
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('Steady', 32, 48);
  ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#9b9690';
  ctx.fillText('Train your resilience.', 32, 72);

  // Stats
  const practiceStreak = storage.getPracticeStreak();
  const weekly = storage.getRecentSessions(7);
  const total = storage.getRecentSessions(365);

  const stats = [
    { label: 'Practice Streak', value: `${practiceStreak.current} days` },
    { label: 'Longest Streak', value: `${practiceStreak.longest} days` },
    { label: 'This Week', value: `${weekly.length} sessions` },
    { label: 'All Time', value: `${total.length} sessions` },
  ];

  stats.forEach((s, i) => {
    const x = 32 + (i % 2) * 280;
    const y = 120 + Math.floor(i / 2) * 90;
    ctx.fillStyle = '#282d33';
    ctx.beginPath();
    ctx.roundRect(x, y, 250, 70, 12);
    ctx.fill();
    ctx.fillStyle = '#9b9690';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(s.label, x + 16, y + 28);
    ctx.fillStyle = '#e2dfd9';
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(s.value, x + 16, y + 54);
  });

  // Weekly bars
  const barY = 320;
  const sessions = storage.getRecentSessions(7);
  const today = new Date();
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = sessions.filter(s => s.date === dateStr).length;
    const x = 32 + (6 - i) * 78;
    const h = count > 0 ? Math.max(count * 12, 6) : 3;
    ctx.fillStyle = count > 0 ? '#8fb591' : '#3a4149';
    ctx.beginPath();
    ctx.roundRect(x, barY - h, 56, h, 4);
    ctx.fill();
    ctx.fillStyle = '#9b9690';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(dayNames[d.getDay()], x + 24, barY + 16);
  }

  // Footer
  ctx.fillStyle = '#7a7570';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`Generated ${new Date().toLocaleDateString()} · Steady`, 32, 380);

  return canvas;
}

// ============================================================================
// SETTINGS VIEW (with theme, reminders)
// ============================================================================

function initSettings() {
  const settings = storage.getSettings();

  // Sound toggle
  const sound = $('setting-sound');
  if (sound) { sound.checked = settings.sound; sound.onchange = (e) => storage.saveSettings({ sound: e.target.checked }); }

  // Reduced motion
  const motion = $('setting-motion');
  if (motion) {
    motion.checked = settings.reducedMotion;
    motion.onchange = (e) => {
      storage.saveSettings({ reducedMotion: e.target.checked });
      document.body.classList.toggle('reduced-motion', e.target.checked);
    };
  }

  // Theme toggle
  setupThemeToggle(settings.theme || 'dark');

  // Reminder
  setupReminderSettings(settings);

  // Export
  const expBtn = $('btn-export');
  if (expBtn) {
    expBtn.onclick = () => {
      const blob = new Blob([storage.exportAllData()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `steady-data-${storage.getToday()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Data exported');
    };
  }

  // Import
  const impBtn = $('btn-import'), impFile = $('import-file');
  if (impBtn && impFile) {
    impBtn.onclick = () => impFile.click();
    impFile.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = storage.importData(ev.target?.result);
        showToast(result.success ? 'Data imported' : `Error: ${result.error}`);
        if (result.success) navigate(appState.currentView);
      };
      reader.readAsText(file);
    };
  }

  // Clear
  const clrBtn = $('btn-clear-data');
  if (clrBtn) {
    clrBtn.onclick = () => {
      if (confirm('Are you sure? This will delete all your data permanently.')) {
        storage.clearAllData();
        showToast('All data cleared');
        navigate('home');
      }
    };
  }
}

function setupThemeToggle(currentTheme) {
  const row = $('theme-toggle-row');
  if (!row) return;
  const buttons = row.querySelectorAll('.theme-option');
  buttons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === currentTheme);
    btn.onclick = () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const theme = btn.dataset.theme;
      storage.saveSettings({ theme });
      applyTheme(theme);
    };
  });
}

function setupReminderSettings(settings) {
  const toggle = $('setting-reminder');
  const timeRow = $('reminder-time-row');
  const timeInput = $('setting-reminder-time');

  if (!toggle) return;

  toggle.checked = settings.reminderEnabled || false;
  if (timeRow) timeRow.style.display = toggle.checked ? 'flex' : 'none';
  if (timeInput) timeInput.value = settings.reminderTime || '09:00';

  toggle.onchange = async (e) => {
    const enabled = e.target.checked;
    if (timeRow) timeRow.style.display = enabled ? 'flex' : 'none';

    if (enabled) {
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          toggle.checked = false;
          if (timeRow) timeRow.style.display = 'none';
          showToast('Notifications blocked by browser');
          storage.saveSettings({ reminderEnabled: false });
          return;
        }
      }
      scheduleReminder(timeInput?.value || '09:00');
    } else {
      cancelReminder();
    }
    storage.saveSettings({ reminderEnabled: enabled });
  };

  if (timeInput) {
    timeInput.onchange = (e) => {
      storage.saveSettings({ reminderTime: e.target.value });
      if (toggle.checked) scheduleReminder(e.target.value);
    };
  }

  // Schedule on load if enabled
  if (settings.reminderEnabled && 'Notification' in window && Notification.permission === 'granted') {
    scheduleReminder(settings.reminderTime || '09:00');
  }
}

// ============================================================================
// DAILY REMINDER (in-app timer — works while tab is open / SW is alive)
// ============================================================================

let reminderTimer = null;

function scheduleReminder(timeStr) {
  cancelReminder();
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);

  const ms = target - now;
  reminderTimer = setTimeout(() => {
    showReminderNotification();
    // Reschedule for tomorrow
    scheduleReminder(timeStr);
  }, ms);
}

function cancelReminder() {
  if (reminderTimer) { clearTimeout(reminderTimer); reminderTimer = null; }
}

function showReminderNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    const messages = [
      'Time for today\'s practice.',
      'A few minutes of training builds real resilience.',
      'Your daily practice is waiting.',
      'Train your nervous system. It takes 3 minutes.',
    ];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    try {
      new Notification('Steady', { body: msg, icon: './icons/icon-192.png', tag: 'steady-reminder' });
    } catch (e) {
      // Notification not supported in this context
    }
  }
}

// ============================================================================
// ONBOARDING FLOW (V3)
// ============================================================================

function showOnboarding() {
  const overlay = $('onboarding-overlay');
  if (!overlay) return;
  overlay.style.display = 'flex';

  let currentStep = 0;
  const steps = overlay.querySelectorAll('.onboard-step');
  const profile = { primaryStressors: [], preferredModalities: [], availableMinutes: 3, goals: ['build-resilience'] };

  function showStep(idx) {
    steps.forEach((s, i) => {
      s.style.display = i === idx ? 'block' : 'none';
      if (i === idx) {
        s.classList.add('narration-enter');
        setTimeout(() => s.classList.remove('narration-enter'), 400);
      }
    });
  }

  function collectSelections(stepEl, field) {
    const selected = stepEl.querySelectorAll('.onboard-chip.selected');
    profile[field] = Array.from(selected).map(el => el.dataset.value);
  }

  // Chip toggle behavior
  overlay.querySelectorAll('.onboard-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      hapticTap();
    });
  });

  // Next buttons
  overlay.querySelectorAll('.onboard-next').forEach(btn => {
    btn.addEventListener('click', () => {
      // Collect data from current step
      if (currentStep === 1) collectSelections(steps[1], 'preferredModalities');
      if (currentStep === 2) collectSelections(steps[2], 'goals');

      currentStep++;
      if (currentStep >= steps.length) {
        // Save profile and close
        storage.saveProfile(profile);
        overlay.style.display = 'none';
        // Refresh home with new profile data
        navigate('home');
      } else {
        showStep(currentStep);
      }
    });
  });

  // Skip button
  const skipBtn = overlay.querySelector('.onboard-skip');
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      storage.saveProfile({ ...profile, completed: true });
      overlay.style.display = 'none';
    });
  }

  showStep(0);
}

// ============================================================================
// APP INITIALIZATION
// ============================================================================

function initializeApp() {
  registerServiceWorker();
  setupPWAInstall();
  setupNavigation();

  // Initialize dual-layer storage (IndexedDB + localStorage)
  // Non-blocking: app works immediately via localStorage while IDB syncs in background
  storage.init().then(() => {
    console.log('IndexedDB storage layer ready');
    // Refresh current view in case IDB hydrated new data
    navigate(appState.currentView);
  }).catch(() => {
    console.warn('IndexedDB init failed — using localStorage only');
  });

  // Apply saved settings
  const settings = storage.getSettings();
  if (settings.reducedMotion) document.body.classList.add('reduced-motion');
  applyTheme(settings.theme || 'dark');

  // Listen for OS theme changes (for auto mode)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const s = storage.getSettings();
    if (s.theme === 'auto') applyTheme('auto');
  });

  navigate('home');

  // V3: Show onboarding for first-time users
  if (!storage.hasCompletedOnboarding()) {
    showOnboarding();
  }
}

// ============================================================================
// ENTRY POINT
// ============================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
