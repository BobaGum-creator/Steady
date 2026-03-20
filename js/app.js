// Steady App - Main Application Logic
// ES Module for hash-based SPA routing, no framework, plain JavaScript

import { exercises, challengeDayMap, intentionCategories, signalDefinitions, challengePhases, getCognitiveTierForDay, getDisruptionCountForDay, getHoldBonusForLevel, getLevelMeta } from './data.js';
import { ExercisePlayer, formatTime } from './player.js';
import {
  getSessions, addSession, saveDailyPractice, getDailyPractice,
  getStreak, getLongestStreak, getProfile, saveProfile, getSettings, saveSettings,
  getBookmarks, toggleBookmark, saveJournalEntry, getJournalEntries,
  saveReflection, getReflections, getChallengeProgram, saveChallengeProgram,
  advanceChallengeDay, isChallengeUnlocked, resetChallenge, getIntentionStats,
  saveCheckIn, getDismissedInsights, dismissInsight, exportAllData, importAllData,
  clearAllData, getWeeklyActivity, getMonthlySessionCount, getMostUsedExercises,
  getExerciseEffectiveness, shouldShowBackupReminder, dismissBackupReminder, markBackupDone
} from './storage.js';
import { getActiveInsights, getReliefRecommendation } from './insights.js';
import { initDB, syncBackup, restoreFromBackup } from './idb.js';

class SteadyApp {
  constructor() {
    this.player = new ExercisePlayer();
    this.currentView = 'home';
    this.currentFilter = 'all';
    this.selectedIntention = null;
    this.recommendedExercise = null;
    this.deferredInstallPrompt = null;
    this.playerMode = null;
    this._chartCache = {}; // Reserved for chart render memoization
    this._reminderInterval = null; // Daily reminder check interval
    this.init();
  }

  async init() {
    try {
      // Initialize IDB backup (non-blocking — app works without it)
      await initDB().catch(e => console.warn('IDB init failed, continuing without backup:', e));

      // Auto-recover from IDB if localStorage appears empty
      try {
        const sessions = getSessions();
        if (sessions.length === 0 && localStorage.getItem('steady_sessions') === null) {
          const backup = await restoreFromBackup();
          if (backup.sessions && backup.sessions.length > 0) {
            localStorage.setItem('steady_sessions', JSON.stringify(backup.sessions));
            if (backup.journal && backup.journal.length > 0) {
              localStorage.setItem('steady_journal', JSON.stringify(backup.journal));
            }
            if (backup.reflections && backup.reflections.length > 0) {
              localStorage.setItem('steady_reflections', JSON.stringify(backup.reflections));
            }
            if (backup.checkins && backup.checkins.length > 0) {
              localStorage.setItem('steady_checkins', JSON.stringify(backup.checkins));
            }
            console.log('[Steady] Restored data from IndexedDB backup');
          }
        }
      } catch (recoveryErr) {
        console.warn('IDB auto-recovery failed:', recoveryErr);
      }

      // Load settings and apply theme
      const settings = getSettings();
      this.applyTheme(settings.theme);
      this.applyReducedMotion(settings.reducedMotion);

      // Check onboarding
      const profile = getProfile();
      if (!profile.completed) {
        const onboardingEl = document.getElementById('onboarding');
        if (onboardingEl) {
          onboardingEl.style.display = 'flex';
        }
      }

      // Setup routing
      this.setupRouting();

      // Setup player callbacks
      this.setupPlayerCallbacks();

      // Register service worker
      this.registerSW();

      // Listen for install prompt
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredInstallPrompt = e;
        const installBtn = document.getElementById('install-btn');
        if (installBtn) {
          installBtn.style.display = 'block';
        }
      });

      // Initial render
      this.renderCurrentView();

      // Setup reminder notification
      this.setupReminder();

      // Listen for SW update notifications
      navigator.serviceWorker && navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data && e.data.type === 'CACHE_UPDATED') {
          this.showToast('App updated — refresh for latest version.');
        }
      });

      // Clean up intervals on page unload to prevent leaks
      window.addEventListener('beforeunload', () => {
        this._clearCountdown();
        if (this._reminderInterval) {
          clearInterval(this._reminderInterval);
          this._reminderInterval = null;
        }
      });

      // Keyboard avoidance: scroll textareas into view on focus (mobile)
      document.addEventListener('focusin', (e) => {
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
          setTimeout(() => {
            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 300);
        }
      });

      // Online/offline detection
      window.addEventListener('online', () => {
        this.showToast('Back online');
      });
      window.addEventListener('offline', () => {
        this.showToast('You\'re offline — data is saved locally');
      });
    } catch (e) {
      console.error('Steady init error:', e);
      // Attempt minimal recovery — at least show the home view
      try {
        this.setupRouting();
        this.renderCurrentView();
      } catch (fatal) {
        console.error('Fatal init error:', fatal);
      }
    }
  }

  // ============================================
  // ROUTING & NAVIGATION
  // ============================================

  setupRouting() {
    let routeTimer = null;
    window.addEventListener('hashchange', () => {
      // Debounce rapid hash changes (e.g., programmatic double-navigation)
      if (routeTimer) cancelAnimationFrame(routeTimer);
      routeTimer = requestAnimationFrame(() => {
        routeTimer = null;
        this.handleRoute();
      });
    });
    this.handleRoute();
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || 'home';
    const viewMap = {
      home: 'home',
      library: 'library',
      player: 'player',
      journal: 'journal',
      history: 'history',
      settings: 'settings'
    };
    const view = viewMap[hash] || 'home';
    this.showView(view);
  }

  navigate(view) {
    window.location.hash = view;
  }

  showView(view) {
    this.currentView = view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const el = document.getElementById(`view-${view}`);
    if (el) {
      el.classList.add('active');
    }

    // Update tab bar
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.view === view);
    });

    // Hide tab bar during player
    const tabBar = document.querySelector('.tab-bar');
    if (tabBar) {
      tabBar.style.display = view === 'player' ? 'none' : 'flex';
    }

    // Render view content
    this.renderView(view);

    // Focus management for accessibility
    const viewEl = document.getElementById(`view-${view}`);
    if (viewEl) {
      const heading = viewEl.querySelector('h1, h2');
      if (heading) heading.focus();
    }
  }

  renderView(view) {
    switch (view) {
      case 'home':
        this.renderHome();
        break;
      case 'library':
        this.renderLibrary();
        break;
      case 'journal':
        this.renderJournal();
        break;
      case 'history':
        this.renderProgress();
        break;
      case 'settings':
        this.renderSettings();
        break;
    }
  }

  // ============================================
  // HOME VIEW
  // ============================================

  renderHome() {
    // Total sessions badge (top-right) — effort that can't be lost
    const sessions = getSessions();
    const badgeEl = document.getElementById('home-sessions-badge');
    const countEl = document.getElementById('home-sessions-count');
    if (badgeEl && countEl) {
      if (sessions.length > 0 || getStreak() > 0) {
        badgeEl.style.display = 'flex';
        const streak = getStreak();
        if (streak > 0) {
          countEl.textContent = `${streak} day streak`;
        } else {
          countEl.textContent = `${sessions.length} session${sessions.length !== 1 ? 's' : ''}`;
        }
      } else {
        badgeEl.style.display = 'none';
      }
    }

    // Ensure challenge program is initialized (program-first approach)
    this.ensureProgramStarted();

    // Render the training hero block
    this.renderTrainingHero();

    // Render mini signal proof (evidence it's working)
    this.renderSignalProof();

    // Check if backup reminder should show
    this.renderBackupBanner();
  }

  /**
   * Ensure the challenge program is started for every user.
   * Program-first: no unlock gate, everyone is in the program from day 1.
   */
  ensureProgramStarted() {
    const program = getChallengeProgram();
    if (!program.unlocked) {
      program.unlocked = true;
      saveChallengeProgram(program);
    }
  }

  /**
   * Render the unified training hero block on the homepage.
   * Combines what was previously the daily practice card + challenge card.
   */
  renderTrainingHero() {
    const program = getChallengeProgram();
    const totalDays = 28;
    const level = program.level || 1;
    const today = new Date().toISOString().split('T')[0];
    const todayPractice = getDailyPractice(today);
    const todayDone = todayPractice && todayPractice.completed;

    const heroEl = document.getElementById('training-hero');
    const ctaEl = document.getElementById('training-cta');
    const doneEl = document.getElementById('training-done');
    const levelCompleteEl = document.getElementById('training-level-complete');

    // Level complete state
    if (program.currentDay > totalDays) {
      if (ctaEl) ctaEl.style.display = 'none';
      if (doneEl) doneEl.style.display = 'none';
      if (levelCompleteEl) levelCompleteEl.style.display = 'block';

      // Still show progress as 100%
      const phaseEl = document.getElementById('training-phase');
      if (phaseEl) phaseEl.textContent = `Level ${level} · Complete`;
      const fillEl = document.getElementById('training-progress-fill');
      if (fillEl) fillEl.style.width = '100%';
      const labelEl = document.getElementById('training-progress-label');
      if (labelEl) labelEl.textContent = '28 of 28 days';
      const titleEl = document.getElementById('training-title');
      if (titleEl) titleEl.textContent = '';
      const descEl = document.getElementById('training-desc');
      if (descEl) descEl.textContent = '';
      const previewEl = document.getElementById('training-preview');
      if (previewEl) previewEl.innerHTML = '';
      return;
    }

    // Hide level complete
    if (levelCompleteEl) levelCompleteEl.style.display = 'none';

    // Phase indicator
    const currentPhase = challengePhases.find(p => p.days.includes(program.currentDay));
    const phaseName = currentPhase ? currentPhase.name : 'Foundation';
    const phaseEl = document.getElementById('training-phase');
    if (phaseEl) phaseEl.textContent = `Level ${level} · ${phaseName}`;

    // Progress bar
    const progress = Math.max(0, (program.currentDay - 1) / totalDays);
    const fillEl = document.getElementById('training-progress-fill');
    if (fillEl) fillEl.style.width = `${Math.round(progress * 100)}%`;
    const labelEl = document.getElementById('training-progress-label');
    if (labelEl) labelEl.textContent = `Day ${program.currentDay} of ${totalDays}`;

    // Get today's exercise from the challenge map
    const exerciseId = challengeDayMap[program.currentDay];
    const exercise = exercises.find(e => e.id === exerciseId);

    // Title & description
    const titleEl = document.getElementById('training-title');
    const descEl = document.getElementById('training-desc');

    if (exercise) {
      if (titleEl) titleEl.textContent = exercise.title;
      // Personalize Day 1 description based on onboarding goals
      const profile = getProfile();
      if (program.currentDay === 1 && level === 1 && profile.goals && profile.goals.length > 0) {
        const goalMap = {
          'resilience': 'Building your stress resilience starts here.',
          'calm': 'Learning to calm down faster starts here.',
          'sleep': 'Better sleep starts with a calmer nervous system.'
        };
        const personalDesc = goalMap[profile.goals[0]];
        if (personalDesc && descEl) {
          descEl.textContent = personalDesc;
        } else {
          if (descEl) descEl.textContent = exercise.subtitle;
        }
      } else {
        if (descEl) descEl.textContent = exercise.subtitle;
      }
    }

    // Session preview tags (what's included)
    const previewEl = document.getElementById('training-preview');
    if (previewEl && exercise) {
      const tags = [];
      const durationMin = Math.ceil(exercise.duration / 60);
      tags.push(`${durationMin} min`);

      // Detect what the exercise contains
      const stepTypes = exercise.steps.map(s => s.type);
      if (stepTypes.some(t => t === 'breathe-in' || t === 'breathe-out')) tags.push('Breathwork');
      if (stepTypes.some(t => t === 'hold' || t === 'pressure-hold')) tags.push('Breath hold');
      if (stepTypes.some(t => t === 'cognitive-slot')) tags.push('Focus drill');
      if (stepTypes.some(t => t === 'disruption-slot')) tags.push('Disruption');
      if (exercise.category === 'body') tags.push('Body scan');

      previewEl.innerHTML = tags.map(t => `<span class="training-tag">${t}</span>`).join('');
    }

    // CTA vs Done state
    if (todayDone) {
      if (ctaEl) ctaEl.style.display = 'none';
      if (doneEl) doneEl.style.display = 'flex';
    } else {
      if (ctaEl) ctaEl.style.display = 'flex';
      if (doneEl) doneEl.style.display = 'none';
    }
  }

  /**
   * Render mini signal proof on homepage — shows average signal trend
   * to give evidence that training is working. Only shown after 3+ sessions.
   */
  renderSignalProof() {
    const proofEl = document.getElementById('signal-proof');
    if (!proofEl) return;

    const sessions = getSessions();
    // Need 3+ sessions with signal data to show a meaningful trend
    const withSignals = sessions.filter(s => s.signalsBefore && s.signalsAfter);
    if (withSignals.length < 3) {
      proofEl.style.display = 'none';
      return;
    }

    proofEl.style.display = 'block';

    // Calculate average total signal per session (before and after)
    const recent = withSignals.slice(-10); // Last 10 sessions
    const avgBefore = recent.map(s => {
      const vals = Object.values(s.signalsBefore).filter(v => typeof v === 'number');
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    });
    const avgAfter = recent.map(s => {
      const vals = Object.values(s.signalsAfter).filter(v => typeof v === 'number');
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    });

    // Summary text — compare first half vs second half average drop
    const detailEl = document.getElementById('signal-proof-detail');
    if (detailEl) {
      const drops = recent.map((s, i) => avgBefore[i] - avgAfter[i]);
      const avgDrop = drops.reduce((a, b) => a + b, 0) / drops.length;
      if (avgDrop > 0.3) {
        detailEl.textContent = 'Trending down after sessions';
        detailEl.style.color = 'var(--success, #5a8a5e)';
      } else if (avgDrop > 0) {
        detailEl.textContent = 'Holding steady';
        detailEl.style.color = 'var(--text-muted)';
      } else {
        detailEl.textContent = `${recent.length} sessions tracked`;
        detailEl.style.color = 'var(--text-muted)';
      }
    }

    // Draw mini sparkline
    const canvas = document.getElementById('signal-proof-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);

    const style = getComputedStyle(document.documentElement);
    const mutedColor = style.getPropertyValue('--text-muted').trim() || '#6b6660';
    const accentColor = style.getPropertyValue('--accent').trim() || '#4a6e4e';

    // Draw "before" line (muted) and "after" line (accent)
    const drawLine = (data, color, dashed) => {
      if (data.length < 2) return;
      const maxVal = 2; // Signal scale 0-2
      const padY = 8;
      const stepX = (w - 20) / (data.length - 1);

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      if (dashed) ctx.setLineDash([4, 4]);
      else ctx.setLineDash([]);

      data.forEach((val, i) => {
        const x = 10 + i * stepX;
        const y = padY + ((maxVal - val) / maxVal) * (h - padY * 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    drawLine(avgBefore, mutedColor, true);   // Before — dashed, muted
    drawLine(avgAfter, accentColor, false);   // After — solid, accent green
  }

  /**
   * Start today's training — launches the challenge exercise for the current day.
   */
  startTodaysTraining() {
    const program = getChallengeProgram();
    const exerciseId = challengeDayMap[program.currentDay];
    if (exerciseId) {
      this.launchPlayer(exerciseId, 'challenge');
    }
  }

  // Keep getTodaysExercise for library/other use
  getTodaysExercise() {
    const trainingExercises = exercises.filter(e => e.mode === 'training' || e.mode === 'both');
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    const sessions = getSessions();
    const recentIds = new Set();
    for (let i = 0; i < 5; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i - 1);
      const dateStr = d.toISOString().split('T')[0];
      sessions.filter(s => s.date === dateStr).forEach(s => recentIds.add(s.exerciseId));
    }
    let index = dayOfYear % trainingExercises.length;
    let attempts = 0;
    while (recentIds.has(trainingExercises[index].id) && attempts < trainingExercises.length) {
      index = (index + 1) % trainingExercises.length;
      attempts++;
    }
    return trainingExercises[index];
  }

  // ============================================
  // PLAYER INTEGRATION
  // ============================================

  beginDailyPractice() {
    // Now redirects to the unified training flow
    this.startTodaysTraining();
  }

  startChallenge() {
    // Now redirects to the unified training flow
    this.startTodaysTraining();
  }

  resetChallenge() {
    resetChallenge();
    this.showToast('Level up! New challenge started.');
    this.renderHome();
  }

  dismissLevelComplete() {
    this.showToast('Take your time. The next level will be here.');
  }

  startPrepare() {
    this.launchPlayer('pre-event-protocol', 'prepare');
  }

  startEmergencyCalm() {
    this.launchPlayer('physiological-sigh', 'relief');
  }

  startRecommended() {
    if (this.recommendedExercise) {
      this.launchPlayer(this.recommendedExercise.id, 'relief');
    }
  }

  launchPlayer(exerciseId, mode) {
    // Re-attach callbacks in case a previous destroy() cleared them
    this.setupPlayerCallbacks();
    this._lastBreathingState = null; // Reset breathing state tracking
    this.player.start(exerciseId);
    this.playerMode = mode;
    this.navigate('player');
    this.showPlayerPhase('precheck');
    this.renderSignalCheck('signal-check-before', {});
  }

  setupPlayerCallbacks() {
    this.player.onPhaseChange = (data) => {
      try {
        if (data.phase === 'pre-check') this.showPlayerPhase('precheck');
        else if (data.phase === 'intention') this.showPlayerPhase('intention');
        else if (data.phase === 'active') this.showBriefing();
        else if (data.phase === 'post-check') this.showPlayerPhase('postcheck');
      } catch (e) {
        console.error('Phase change error:', e);
        // Fallback: try to show the active phase directly
        try { this.showPlayerPhase('active'); } catch (_) { /* last resort */ }
      }
    };

    this.player.onStepChange = (data) => {
      try {
        this.renderActiveStep(data);
      } catch (e) {
        console.error('Step render error:', e);
      }
    };

    this.player.onStepTick = (data) => {
      try {
        // Update countdown inside breathing circle
        const countdownEl = document.getElementById('breathing-countdown');
        if (countdownEl && data.duration) {
          const remaining = data.duration - data.elapsed;
          countdownEl.textContent = remaining > 0 ? remaining : '';
        }

        // Show "next up" cue when 2 seconds remain
        if (data.duration && (data.duration - data.elapsed) === 2) {
          this.showNextStepCue();
        }
      } catch (e) {
        // Tick errors are non-fatal — swallow to keep timer running
      }
    };

    this.player.onTimerTick = (data) => {
      try {
        const timerEl = document.getElementById('player-timer');
        const progressEl = document.getElementById('progress-fill');
        if (timerEl) timerEl.textContent = formatTime(data.remaining);
        if (progressEl) {
          const pct = (data.elapsed / data.duration) * 100;
          progressEl.style.width = `${pct}%`;
        }
      } catch (e) {
        // Tick errors are non-fatal
      }
    };
  }

  showPlayerPhase(phase) {
    document.querySelectorAll('.player-phase').forEach(p => (p.style.display = 'none'));
    const phaseEl = document.getElementById(`phase-${phase}`);
    if (phaseEl) phaseEl.style.display = 'flex';

    if (phase === 'active') {
      const titleEl = document.getElementById('player-title');
      const timerEl = document.getElementById('player-timer');
      if (titleEl) titleEl.textContent = this.player.currentExercise.title;
      if (timerEl) timerEl.textContent = formatTime(this.player.currentExercise.duration);
      this.renderStepDots();
      this.renderPatternReference();
    }

    if (phase === 'intention') {
      this.renderIntentionChips();
    }

    if (phase === 'postcheck') {
      this.renderPostCheck();
    }
  }

  /**
   * Show the briefing screen before the active exercise phase
   * Pauses the player while the user reads what the exercise is about
   */
  showBriefing() {
    const ex = this.player.currentExercise;
    if (!ex) return;

    // Pause the player timer while briefing is shown
    this.player.pause();

    // Hide all phases, show briefing
    document.querySelectorAll('.player-phase').forEach(p => (p.style.display = 'none'));
    const briefingEl = document.getElementById('phase-briefing');
    if (!briefingEl) {
      // Fallback: skip briefing if element missing
      this.startFromBriefing();
      return;
    }

    // Populate briefing content
    const titleEl = briefingEl.querySelector('.briefing-title');
    const subtitleEl = briefingEl.querySelector('.briefing-subtitle');
    const bodyEl = briefingEl.querySelector('.briefing-body');
    const durationEl = briefingEl.querySelector('.briefing-duration');
    const patternEl = briefingEl.querySelector('.briefing-pattern');
    const modeEl = briefingEl.querySelector('.briefing-mode');

    if (titleEl) titleEl.textContent = ex.title;
    if (subtitleEl) subtitleEl.textContent = ex.subtitle || '';
    if (bodyEl) bodyEl.textContent = ex.briefing || '';
    if (durationEl) durationEl.textContent = formatTime(ex.duration);

    // Show breathing pattern if applicable
    if (patternEl) {
      const pattern = this.getBreathingPattern(ex);
      if (pattern) {
        patternEl.textContent = pattern;
        patternEl.style.display = 'block';
      } else {
        patternEl.style.display = 'none';
      }
    }

    // Show mode badge
    if (modeEl) {
      const modeLabels = {
        relief: 'Quick Relief',
        training: 'Training',
        challenge: 'Challenge',
        both: 'Training',
        prepare: 'Preparation'
      };
      modeEl.textContent = modeLabels[ex.mode] || 'Exercise';
      modeEl.className = 'briefing-mode briefing-mode--' + (ex.mode || 'training');
    }

    briefingEl.style.display = 'flex';
  }

  /**
   * Get a human-readable breathing pattern string for an exercise
   */
  getBreathingPattern(exercise) {
    const steps = exercise.steps || [];
    const breathSteps = steps.filter(s =>
      s.type === 'breathe-in' || s.type === 'breathe-out' || s.type === 'hold' || s.type === 'pressure-hold'
    );

    if (breathSteps.length < 2) return null;

    // Find the repeating pattern (first cycle)
    const patternParts = [];
    const typeLabels = {
      'breathe-in': 'In',
      'breathe-out': 'Out',
      'hold': 'Hold',
      'pressure-hold': 'Hold'
    };

    for (const step of steps) {
      if (step.type === 'repeat' || step.type === 'prompt') {
        if (patternParts.length >= 2) break;
        if (step.type === 'prompt' && patternParts.length === 0) continue;
        if (step.type === 'repeat') break;
      }
      if (typeLabels[step.type] && step.duration) {
        patternParts.push(`${typeLabels[step.type]} ${step.duration}s`);
      }
      if (patternParts.length >= 6) break; // Cap at 6 to avoid huge patterns
    }

    if (patternParts.length < 2) return null;
    return patternParts.join(' \u2192 ');
  }

  /**
   * Render the persistent breathing pattern reference in the active phase header
   */
  renderPatternReference() {
    const refEl = document.getElementById('pattern-reference');
    if (!refEl) return;

    const pattern = this.getBreathingPattern(this.player.currentExercise);
    if (pattern) {
      refEl.textContent = pattern;
      refEl.style.display = 'block';
    } else {
      refEl.style.display = 'none';
    }
  }

  /**
   * Start the exercise from the briefing screen
   */
  startFromBriefing() {
    // Clear any previous countdown that might still be running
    this._clearCountdown();

    // Show a short countdown transition before the exercise starts
    document.querySelectorAll('.player-phase').forEach(p => (p.style.display = 'none'));
    const countdownEl = document.getElementById('phase-countdown');
    if (!countdownEl) {
      this.showPlayerPhase('active');
      this.player.resume();
      return;
    }

    const wordEl = countdownEl.querySelector('.countdown-word');
    countdownEl.style.display = 'flex';

    const words = ['Ready', 'Breathe', 'Go'];
    let i = 0;

    wordEl.textContent = words[0];
    wordEl.classList.add('countdown-word--visible');

    this._countdownInterval = setInterval(() => {
      i++;
      if (i >= words.length) {
        this._clearCountdown();
        countdownEl.style.display = 'none';
        this.showPlayerPhase('active');
        this.player.resume();
        return;
      }
      wordEl.classList.remove('countdown-word--visible');
      setTimeout(() => {
        wordEl.textContent = words[i];
        wordEl.classList.add('countdown-word--visible');
      }, 200);
    }, 1000);
  }

  /** Clear the countdown interval to prevent timer leaks */
  _clearCountdown() {
    if (this._countdownInterval) {
      clearInterval(this._countdownInterval);
      this._countdownInterval = null;
    }
  }

  renderActiveStep(data) {
    const instruction = document.getElementById('step-instruction');
    const circle = document.getElementById('breathing-circle');
    const countdownEl = document.getElementById('breathing-countdown');
    const nextCue = document.getElementById('step-next-cue');

    if (instruction) instruction.textContent = data.step.instruction;

    // Initialize countdown
    if (countdownEl) {
      countdownEl.textContent = data.step.duration > 0 ? data.step.duration : '';
    }

    // Clear next-step cue on new step
    if (nextCue) {
      nextCue.textContent = '';
      nextCue.classList.remove('step-next-cue--visible');
    }

    // Breathing circle animation
    if (circle) {
      // Track previous state to keep hold at correct scale
      const prevState = this._lastBreathingState || null;
      this._lastBreathingState = data.breathingState;

      circle.className = 'breathing-circle';
      if (data.breathingState === 'inhale') {
        circle.classList.add('breathing-circle--inhale');
      } else if (data.breathingState === 'exhale') {
        circle.classList.add('breathing-circle--exhale');
      } else if (data.breathingState === 'hold') {
        // Hold after inhale = stay expanded; hold after exhale = stay small
        const isExpanded = (prevState === 'inhale' || prevState === null);
        const holdClass = data.step.type === 'pressure-hold' ? 'breathing-circle--pressure-hold' : 'breathing-circle--hold';
        circle.classList.add(holdClass);
        if (isExpanded) {
          circle.classList.add('breathing-circle--hold-expanded');
        } else {
          circle.classList.add('breathing-circle--hold-contracted');
        }
      }
    }

    // Disruption effect
    if (data.step.type === 'disruption') {
      if (instruction) {
        instruction.classList.add('step--disruption');
        setTimeout(() => instruction.classList.remove('step--disruption'), 500);
      }
    }

    // Update step dots
    const dotsContainer = document.getElementById('step-dots');
    if (dotsContainer) {
      const allDots = dotsContainer.querySelectorAll('.step-progress__dot');
      allDots.forEach((dot, i) => {
        dot.classList.remove('active', 'completed');
        if (i === data.index) dot.classList.add('active');
        else if (i < data.index) dot.classList.add('completed');
      });
    }

    // Update step count
    const stepCountEl = document.getElementById('step-count');
    if (stepCountEl) stepCountEl.textContent = `Step ${data.index + 1} of ${data.total}`;
  }

  /**
   * Show a "next up" cue 2 seconds before step ends
   * Peeks at the next step and displays a brief preview
   */
  showNextStepCue() {
    const cueEl = document.getElementById('step-next-cue');
    if (!cueEl) return;

    const steps = this.player.resolvedSteps || (this.player.currentExercise && this.player.currentExercise.steps);
    if (!steps) return;

    const nextIndex = this.player.currentStepIndex + 1;

    // If this is the last step, show completion cue
    if (nextIndex >= steps.length) {
      cueEl.textContent = 'Almost done';
      cueEl.classList.add('step-next-cue--visible');
      return;
    }

    const nextStep = steps[nextIndex];
    if (!nextStep) return;

    // If next step is a repeat, show the first step in the pattern instead
    if (nextStep.type === 'repeat') {
      cueEl.textContent = 'Next cycle starting';
      cueEl.classList.add('step-next-cue--visible');
      return;
    }

    const cueLabels = {
      'breathe-in': 'Next: Breathe in',
      'breathe-out': 'Next: Breathe out',
      'hold': 'Next: Hold',
      'pressure-hold': 'Next: Hold steady',
      'prompt': 'Next: Reflect',
      'timed': 'Next: Continue',
      'cognitive': 'Next: Think',
      'disruption': 'Next: Reset'
    };

    cueEl.textContent = cueLabels[nextStep.type] || 'Next step coming';
    cueEl.classList.add('step-next-cue--visible');
  }

  renderSignalCheck(containerId, defaults) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const signals = ['mind', 'body', 'breath', 'pressure'];

    container.innerHTML = signals
      .map(sig => {
        // Handle both object and array format for signalDefinitions
        let def;
        if (Array.isArray(signalDefinitions)) {
          def = signalDefinitions.find(s => s.id === sig);
        } else {
          def = signalDefinitions[sig];
        }

        const name = def ? def.label : sig;
        const levels = def ? def.levels : ['Low', 'Medium', 'High'];
        const iconMap = { mind: '◎', body: '∥', breath: '∿', pressure: '⌃' };
        const icon = iconMap[sig] || '';

        return `
        <div class="signal-row" data-signal="${sig}">
          <span class="signal-row-label">${icon} ${name}</span>
          <div class="signal-levels">
            ${levels
              .map(
                (level, i) => `
              <button class="signal-level ${defaults[sig] === i ? 'signal-level--active' : ''}"
                      data-signal="${sig}" data-level="${i}"
                      onclick="app.selectSignalLevel('${containerId}', '${sig}', ${i})">
                ${level}
              </button>
            `
              )
              .join('')}
          </div>
        </div>
      `;
      })
      .join('');
  }

  selectSignalLevel(containerId, signal, level) {
    // Validate signal level is 0-2
    level = Math.max(0, Math.min(2, parseInt(level) || 0));
    const container = document.getElementById(containerId);
    if (!container) return;
    const row = container.querySelector(`[data-signal="${signal}"]`);
    if (!row) return;
    row.querySelectorAll('.signal-level').forEach(btn => btn.classList.remove('signal-level--active'));
    const activeBtn = row.querySelector(`[data-level="${level}"]`);
    if (activeBtn) activeBtn.classList.add('signal-level--active');

    // Live-update the debrief readout when rating post-exercise signals
    if (containerId === 'signal-check-after' && this.player && this.player.phase === 'post-check') {
      this.updateDebriefShift();
    }
  }

  getSelectedSignals(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return {};
    const signals = {};
    container.querySelectorAll('.signal-row').forEach(row => {
      const sig = row.dataset.signal;
      const active = row.querySelector('.signal-level--active');
      signals[sig] = active ? parseInt(active.dataset.level) : 0;
    });
    return signals;
  }

  proceedFromPreCheck() {
    const signals = this.getSelectedSignals('signal-check-before');
    this.player.setSignalsBefore(signals);
    this.player.proceedFromPreCheck();
  }

  renderIntentionChips() {
    const container = document.getElementById('intention-chips');
    if (!container) return;
    container.innerHTML = intentionCategories
      .map(
        cat =>
          `<button class="chip" data-value="${cat.id}" onclick="app.toggleIntentionChip(this)">${cat.label}</button>`
      )
      .join('');
  }

  toggleIntentionChip(el) {
    document.querySelectorAll('#intention-chips .chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    this.selectedIntention = el.dataset.value;
  }

  setIntention() {
    if (this.selectedIntention) {
      this.player.setIntention(this.selectedIntention);
    }
    this.player.beginExercise();
  }

  skipIntention() {
    this.player.skipIntention();
  }

  togglePause() {
    if (this.player.isPaused) {
      this.player.resume();
      const pauseIcon = document.getElementById('pause-icon');
      const playIcon = document.getElementById('play-icon');
      if (pauseIcon) pauseIcon.style.display = 'block';
      if (playIcon) playIcon.style.display = 'none';
    } else {
      this.player.pause();
      const pauseIcon = document.getElementById('pause-icon');
      const playIcon = document.getElementById('play-icon');
      if (pauseIcon) pauseIcon.style.display = 'none';
      if (playIcon) playIcon.style.display = 'block';
    }
  }

  restartExercise() {
    this.player.restart();
  }

  skipStep() {
    this.player.skipStep();
  }

  exitPlayer() {
    // If exercise is actively running (even if paused or in countdown), confirm before exiting
    if (this.player && this.player.isRunning) {
      this.showModal('Leave exercise?', 'Your progress on this exercise will not be saved.', () => {
        this._clearCountdown();
        this.player.destroy();
        this.navigate('home');
      });
      return;
    }
    this._clearCountdown();
    this.player.destroy();
    this.navigate('home');
  }

  renderPostCheck() {
    this.renderSignalCheck('signal-check-after', this.player.signalsBefore || {});
    this.renderDebrief();
  }

  renderDebrief() {
    const before = this.player.signalsBefore || {};
    const exercise = this.player.currentExercise;
    const elapsed = this.player.totalElapsed || (exercise ? exercise.duration : 0);

    // --- Debrief title: short, factual, on-brand ---
    const titleEl = document.getElementById('debrief-title');
    if (titleEl) {
      const elevated = Object.values(before).filter(v => v >= 2).length; // count high signals only
      const totalSessions = getSessions().length + 1; // +1 for current unsaved session

      if (elevated === 0) {
        titleEl.textContent = 'Session logged.';
      } else if (totalSessions <= 3) {
        titleEl.textContent = 'First reps in.';
      } else {
        titleEl.textContent = 'Session complete.';
      }
    }

    // --- Signal Shift Readout ---
    const readout = document.getElementById('debrief-readout');
    if (readout) {
      const signals = ['mind', 'body', 'breath', 'pressure'];
      const elevated = signals.filter(s => (before[s] || 0) > 0);

      if (elevated.length === 0) {
        readout.innerHTML = '<p class="debrief-baseline">All signals at baseline. Rate again below to track any shift.</p>';
      } else {
        readout.innerHTML = elevated.map(sig => {
          const def = signalDefinitions[sig];
          const label = def ? def.label : sig;
          const levels = def ? def.levels : ['Low', 'Medium', 'High'];
          const beforeLevel = before[sig] || 0;
          const beforeLabel = levels[beforeLevel] || '—';
          return `
            <div class="debrief-shift-row">
              <span class="debrief-shift-label">${label}</span>
              <span class="debrief-shift-value">
                <span class="debrief-shift-before">${beforeLabel}</span>
                <span class="debrief-shift-arrow">→</span>
                <span class="debrief-shift-after">?</span>
              </span>
            </div>
          `;
        }).join('');
      }
    }

    // --- Session stats: duration, streak, challenge day ---
    const statsEl = document.getElementById('debrief-stats');
    if (statsEl) {
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

      const streak = getStreak();
      // Streak will include today once saved, so show streak + 1 as preview
      const streakPreview = streak + 1;

      const program = getChallengeProgram();
      const dayStr = program.unlocked ? `Day ${program.currentDay} of 28` : null;

      let statsHTML = `<div class="debrief-stat"><span class="debrief-stat-value">${durationStr}</span><span class="debrief-stat-label">Duration</span></div>`;
      statsHTML += `<div class="debrief-stat"><span class="debrief-stat-value">${streakPreview}d</span><span class="debrief-stat-label">Streak</span></div>`;
      if (dayStr) {
        statsHTML += `<div class="debrief-stat"><span class="debrief-stat-value">${program.currentDay}/28</span><span class="debrief-stat-label">Program</span></div>`;
      }
      statsEl.innerHTML = statsHTML;
    }

    // --- Next up: tomorrow's training preview ---
    const nextEl = document.getElementById('debrief-next');
    const nextTitleEl = document.getElementById('debrief-next-title');
    if (nextEl && nextTitleEl && this.playerMode === 'challenge') {
      const program = getChallengeProgram();
      const nextDay = program.currentDay + 1;
      const nextExerciseId = challengeDayMap[nextDay];
      if (nextExerciseId && nextDay <= 28) {
        const nextExercise = exercises.find(e => e.id === nextExerciseId);
        if (nextExercise) {
          nextTitleEl.textContent = nextExercise.title;
          nextEl.style.display = '';
        }
      } else if (nextDay > 28) {
        nextTitleEl.textContent = 'Final day. Level complete after this.';
        nextEl.style.display = '';
      }
    }

    // --- Share on milestone days (7, 14, 21, 28) ---
    const shareEl = document.getElementById('debrief-share');
    if (shareEl && this.playerMode === 'challenge') {
      const program = getChallengeProgram();
      const day = program.currentDay;
      if (day === 7 || day === 14 || day === 21 || day === 28) {
        shareEl.style.display = '';
      }
    }
  }

  /**
   * Update the shift readout "after" values once user rates post-signals.
   * Called from selectSignalLevel when containerId is 'signal-check-after'.
   */
  updateDebriefShift() {
    const before = this.player.signalsBefore || {};
    const after = this.getSelectedSignals('signal-check-after');
    const signals = ['mind', 'body', 'breath', 'pressure'];

    signals.forEach(sig => {
      const beforeVal = before[sig] || 0;
      if (beforeVal === 0) return; // wasn't elevated, not shown

      const afterVal = after[sig];
      if (afterVal === undefined) return;

      const def = signalDefinitions[sig];
      const levels = def ? def.levels : ['Low', 'Medium', 'High'];
      const afterLabel = levels[afterVal] || '—';

      // Find the matching row and update the "after" span
      const rows = document.querySelectorAll('.debrief-shift-row');
      rows.forEach(row => {
        const label = row.querySelector('.debrief-shift-label');
        if (label && label.textContent === (def ? def.label : sig)) {
          const afterSpan = row.querySelector('.debrief-shift-after');
          if (afterSpan) {
            afterSpan.textContent = afterLabel;
            // Color the shift
            const diff = beforeVal - afterVal;
            if (diff > 0) {
              afterSpan.classList.add('debrief-shift--improved');
              afterSpan.classList.remove('debrief-shift--same', 'debrief-shift--worse');
            } else if (diff === 0) {
              afterSpan.classList.add('debrief-shift--same');
              afterSpan.classList.remove('debrief-shift--improved', 'debrief-shift--worse');
            } else {
              afterSpan.classList.add('debrief-shift--worse');
              afterSpan.classList.remove('debrief-shift--improved', 'debrief-shift--same');
            }
          }
        }
      });
    });
  }

  saveAndClose() {
    const signalsAfter = this.getSelectedSignals('signal-check-after');
    this.player.setSignalsAfter(signalsAfter);
    const session = this.player.getSessionData();
    addSession(session);

    // Save daily practice if training mode
    if (this.playerMode === 'training' || this.playerMode === 'both') {
      saveDailyPractice(session.date, session.exerciseId);
    }

    // Advance challenge if challenge mode
    if (this.playerMode === 'challenge') {
      advanceChallengeDay();
      saveDailyPractice(session.date, session.exerciseId);
    }

    // Backup to IDB
    syncBackup({ sessions: getSessions() });

    // Check if user was carrying heavy stress — prompt to unload
    const before = this.player.signalsBefore || {};
    const maxSignal = Math.max(...Object.values(before).map(v => typeof v === 'number' ? v : 0));
    if (maxSignal >= 2) {
      this.navigate('home');
      // Show a longer toast with journal nudge
      this.showToast('Session logged');
      setTimeout(() => this.showUnloadNudge(), 600);
    } else {
      this.showToast('Session logged');
      this.navigate('home');
    }
  }

  skipSave() {
    this.navigate('home');
  }

  showUnloadNudge() {
    const toast = document.getElementById('toast');
    const messageEl = document.getElementById('toast-message');
    if (!toast || !messageEl) return;

    messageEl.innerHTML = 'Carrying something? <u style="cursor:pointer" onclick="app.navigate(\'journal\'); app.showToast(\'\');">Unload it</u>';
    toast.style.display = 'block';
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, 4000); // Show for 4 seconds (longer than normal toast)
  }

  shareMilestone() {
    const program = getChallengeProgram();
    const day = program.currentDay;
    const level = program.level || 1;
    const streak = getStreak();
    const text = `Day ${day} of Steady — Level ${level}. ${streak} day streak. Training my nervous system to handle pressure better.`;

    if (navigator.share) {
      navigator.share({ title: 'Steady', text }).catch(() => {});
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('Copied to clipboard');
      }).catch(() => {
        this.showToast('Could not share');
      });
    }
  }

  // ============================================
  // LIBRARY VIEW
  // ============================================

  renderLibrary() {
    this.renderExerciseList();
  }

  filterExercises(filter) {
    this.currentFilter = filter;
    document.querySelectorAll('.filter-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.filter === filter);
    });
    this.renderExerciseList();
  }

  renderExerciseList() {
    const bookmarks = getBookmarks();
    let filtered = [...exercises];

    switch (this.currentFilter) {
      case 'training':
        filtered = filtered.filter(e => e.mode === 'training' || e.mode === 'both');
        break;
      case 'challenge':
        filtered = filtered.filter(e => e.mode === 'challenge');
        break;
      case 'prepare':
        filtered = filtered.filter(e => e.mode === 'prepare');
        break;
      case 'relief':
        filtered = filtered.filter(e => e.mode === 'relief' || e.mode === 'both');
        break;
      case 'saved':
        filtered = filtered.filter(e => bookmarks.includes(e.id));
        break;
      case 'breathwork':
        filtered = filtered.filter(e => e.category === 'breathwork');
        break;
      case 'body':
        filtered = filtered.filter(e => e.category === 'body');
        break;
      case 'mind':
        filtered = filtered.filter(e => e.category === 'mind');
        break;
      case 'quick':
        filtered = filtered.filter(e => e.category === 'quick');
        break;
    }

    const list = document.getElementById('exercise-list');
    if (!list) return;

    if (filtered.length === 0) {
      list.innerHTML = '<div class="empty-state">No exercises found</div>';
      return;
    }

    list.innerHTML = filtered
      .map(ex => {
        const saved = bookmarks.includes(ex.id);
        return `
        <div class="exercise-card exercise-card--${ex.category}" onclick="app.launchPlayer('${ex.id}', '${ex.mode}')">
          <div class="exercise-card-content">
            <h4 class="exercise-card-title">${this.escapeHtml(ex.title)}</h4>
            <p class="exercise-card-subtitle">${this.escapeHtml(ex.subtitle)}</p>
            <span class="exercise-card-duration">${Math.ceil(ex.duration / 60)} min</span>
          </div>
          <button class="btn-icon bookmark-icon ${saved ? 'active' : ''}" onclick="event.stopPropagation(); app.toggleBookmark('${ex.id}')" aria-label="Save">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke="currentColor" stroke-width="1.5" fill="${saved ? 'currentColor' : 'none'}"/></svg>
          </button>
        </div>
      `;
      })
      .join('');
  }

  toggleBookmark(exerciseId) {
    toggleBookmark(exerciseId);
    this.renderExerciseList();
  }

  // ============================================
  // JOURNAL VIEW
  // ============================================

  renderJournal() {
    this.renderJournalEntries();
  }

  switchJournalTab(tab) {
    document.querySelectorAll('.journal-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    const tabUnload = document.getElementById('tab-unload');
    const tabReflect = document.getElementById('tab-reflect');
    if (tabUnload) tabUnload.style.display = tab === 'unload' ? 'block' : 'none';
    if (tabReflect) tabReflect.style.display = tab === 'reflect' ? 'block' : 'none';
  }

  saveJournal() {
    const stressorEl = document.getElementById('journal-stressor');
    const controlEl = document.getElementById('journal-control');
    const nextstepEl = document.getElementById('journal-nextstep');

    if (!stressorEl || !controlEl || !nextstepEl) return;

    const stressor = stressorEl.value.trim();
    const inControl = controlEl.value.trim();
    const nextStep = nextstepEl.value.trim();

    if (!stressor) {
      this.showToast("Write what's stressing you first");
      return;
    }

    saveJournalEntry({
      stressor,
      inControl,
      nextStep,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now()
    });

    // Clear form
    stressorEl.value = '';
    controlEl.value = '';
    nextstepEl.value = '';

    this.showToast('Entry saved');
    this.renderJournalEntries();
    syncBackup({ journal: getJournalEntries() });
  }

  saveReflection() {
    const situationEl = document.getElementById('reflect-situation');
    const wouldchangeEl = document.getElementById('reflect-wouldchange');

    if (!situationEl || !wouldchangeEl) return;

    const situation = situationEl.value.trim();
    if (!situation) {
      this.showToast('Describe the situation first');
      return;
    }

    const tools = document.querySelector('#reflect-tools .chip.active');
    const reg = document.querySelector('#reflect-regulation .chip.active');

    saveReflection({
      situation,
      usedTools: tools ? tools.dataset.value : 'didnt',
      regulationLevel: reg ? parseInt(reg.dataset.value) : 0,
      wouldChange: wouldchangeEl.value.trim(),
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now()
    });

    // Clear form
    situationEl.value = '';
    wouldchangeEl.value = '';
    document.querySelectorAll('#reflect-tools .chip, #reflect-regulation .chip').forEach(c => c.classList.remove('active'));

    this.showToast('Reflection saved');
    this.renderJournalEntries();
    syncBackup({ reflections: getReflections() });
  }

  selectReflectOption(el, groupId) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
  }

  renderJournalEntries() {
    const entries = getJournalEntries();
    const reflections = getReflections();

    // Combine and sort by timestamp desc
    const all = [
      ...entries.map(e => ({ ...e, type: 'unload' })),
      ...reflections.map(r => ({ ...r, type: 'reflect' }))
    ].sort((a, b) => b.timestamp - a.timestamp);

    const list = document.getElementById('journal-entries-list');
    if (!list) return;

    if (all.length === 0) {
      list.innerHTML = '<div class="empty-state">No entries yet. Start writing.</div>';
      return;
    }

    list.innerHTML = all
      .slice(0, 20)
      .map(entry => {
        if (entry.type === 'unload') {
          return `<div class="journal-entry"><span class="entry-type">Unload</span><span class="entry-date">${entry.date}</span><p>${this.escapeHtml(entry.stressor)}</p></div>`;
        } else {
          const regLabels = ['Overwhelmed', 'Managed', 'Steady'];
          return `<div class="journal-entry journal-entry--reflect"><span class="entry-type">Reflect</span><span class="entry-date">${entry.date}</span><p>${this.escapeHtml(entry.situation)}</p><span class="entry-reg">${regLabels[entry.regulationLevel] || ''}</span></div>`;
        }
      })
      .join('');
  }

  // ============================================
  // PROGRESS/HISTORY VIEW
  // ============================================

  renderProgress() {
    // Stats — lead with cumulative progress, demote streak
    const statTotal = document.getElementById('stat-total');
    const statChallenge = document.getElementById('stat-challenge');
    const statWeek = document.getElementById('stat-week');
    const statStreak = document.getElementById('stat-streak');

    const sessions = getSessions();
    const program = getChallengeProgram();
    const completedDays = Array.isArray(program.completedDays) ? program.completedDays.length : 0;
    const challengePct = Math.round((completedDays / 28) * 100);

    if (statTotal) statTotal.textContent = sessions.length;
    if (statChallenge) statChallenge.textContent = `${challengePct}%`;
    if (statWeek) statWeek.textContent = getWeeklyActivity().reduce((s, d) => s + d.count, 0);
    if (statStreak) statStreak.textContent = getStreak();

    // Challenge progress
    this.renderChallengeProgress();

    // Intention stats
    this.renderIntentionProgress();

    // Charts
    this.renderWeeklyChart();
    this.renderSignalChart();

    // Recent sessions
    this.renderRecentSessions();

    // Most helpful
    this.renderMostHelpful();
  }

  renderChallengeProgress() {
    const unlocked = isChallengeUnlocked();
    const card = document.getElementById('challenge-progress-card');
    if (!card) return;

    if (!unlocked) {
      card.style.display = 'none';
      return;
    }

    card.style.display = 'block';
    const program = getChallengeProgram();
    const totalDays = 28;
    const level = program.level || 1;

    // Update card title
    const cardTitle = card.querySelector('.card-title');
    if (cardTitle) cardTitle.textContent = `Level ${level} Challenge`;

    const dots = document.getElementById('challenge-dots');
    if (dots) {
      // Render 28 dots grouped by phase
      let html = '';
      challengePhases.forEach(phase => {
        const phaseName = phase.name.toLowerCase();
        html += `<div class="challenge-phase-group" data-phase="${phaseName}">`;
        html += `<span class="challenge-phase-name">${phase.name}</span>`;
        html += '<div class="challenge-phase-dots">';
        phase.days.forEach(day => {
          const completed = program.completedDays.includes(day);
          const current = day === program.currentDay;
          html += `<div class="challenge-dot ${completed ? 'completed' : ''} ${current ? 'current' : ''}" data-phase="${phaseName}" title="Day ${day}"></div>`;
        });
        html += '</div></div>';
      });
      dots.innerHTML = html;
    }

    // Phase label
    const currentPhaseObj = challengePhases.find(p => p.days.includes(program.currentDay));
    const currentPhaseName = currentPhaseObj ? currentPhaseObj.name : (program.currentDay > totalDays ? 'Complete' : 'Foundation');

    const phaseLabel = document.getElementById('challenge-phase-label');
    if (phaseLabel) {
      const progress = Math.round((Math.min(program.currentDay - 1, totalDays) / totalDays) * 100);
      phaseLabel.textContent = `${currentPhaseName} · ${progress}% complete`;
    }
  }

  renderIntentionProgress() {
    const stats = getIntentionStats();
    const card = document.getElementById('intention-progress-card');
    if (!card) return;

    const entries = Object.entries(stats).filter(([k, v]) => v > 0);

    if (entries.length === 0) {
      card.style.display = 'none';
      return;
    }

    card.style.display = 'block';
    const list = document.getElementById('intention-stats-list');
    if (!list) return;

    list.innerHTML = entries
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => {
        const label = intentionCategories.find(c => c.id === cat)?.label || cat;
        return `<div class="intention-stat"><span>${label}</span><span class="intention-count">Trained ${count} times</span></div>`;
      })
      .join('');
  }

  renderWeeklyChart() {
    const canvas = document.getElementById('weekly-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = getWeeklyActivity();

    // Skip re-render if data hasn't changed since last draw
    const dataKey = JSON.stringify(data);
    if (this._chartCache.weeklyData === dataKey) return;
    this._chartCache.weeklyData = dataKey;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    ctx.clearRect(0, 0, w, h);

    const maxCount = Math.max(...data.map(d => d.count), 1);
    const barWidth = (w - 60) / 7;
    const style = getComputedStyle(document.documentElement);
    const accent = style.getPropertyValue('--accent').trim() || '#4a6e4e';
    const textColor = style.getPropertyValue('--text-muted').trim() || '#6b6660';

    data.forEach((d, i) => {
      const barH = (d.count / maxCount) * (h - 40);
      const x = 30 + i * barWidth;
      const y = h - 25 - barH;

      ctx.fillStyle = accent;
      ctx.fillRect(x + 4, y, barWidth - 8, barH);

      // Day label
      ctx.fillStyle = textColor;
      ctx.font = '10px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      const dayLabel = new Date(d.date).toLocaleDateString('en', { weekday: 'short' });
      ctx.fillText(dayLabel, x + barWidth / 2, h - 8);
    });
  }

  renderSignalChart() {
    const canvas = document.getElementById('signal-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sessions = getSessions().slice(-14);
    if (sessions.length < 2) {
      // Show empty state message
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      const style = getComputedStyle(document.documentElement);
      ctx.fillStyle = style.getPropertyValue('--text-muted').trim() || '#6b6660';
      ctx.font = '13px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Complete 2+ sessions to see trends', w / 2, h / 2);
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    ctx.clearRect(0, 0, w, h);

    const style = getComputedStyle(document.documentElement);
    const colors = {
      mind: style.getPropertyValue('--text-secondary').trim() || '#9b9690',
      body: style.getPropertyValue('--warning').trim() || '#a08058',
      breath: style.getPropertyValue('--accent').trim() || '#4a6e4e',
      pressure: style.getPropertyValue('--danger').trim() || '#b05a50'
    };

    ['mind', 'body', 'breath', 'pressure'].forEach(signal => {
      ctx.beginPath();
      ctx.strokeStyle = colors[signal];
      ctx.lineWidth = 1.5;
      sessions.forEach((s, i) => {
        const x = 30 + (i / (sessions.length - 1)) * (w - 60);
        const val = s.signalsBefore ? s.signalsBefore[signal] || 0 : 0;
        const y = h - 25 - (val / 2) * (h - 50);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
  }

  renderRecentSessions() {
    const allSessions = getSessions().reverse();
    const list = document.getElementById('session-list');
    if (!list) return;

    if (allSessions.length === 0) {
      list.innerHTML = '<div class="empty-state">Complete your first exercise to see sessions here.</div>';
      return;
    }

    // Limit to 20 most recent sessions
    const sessions = allSessions.slice(0, 20);
    const hasMore = allSessions.length > 20;

    let html = sessions
      .map(s => {
        const ex = exercises.find(e => e.id === s.exerciseId);
        return `<div class="session-item"><div><strong>${this.escapeHtml(ex ? ex.title : s.exerciseId)}</strong><span class="session-date">${s.date}</span></div><span class="session-duration">${Math.ceil(s.duration / 60)}m</span></div>`;
      })
      .join('');

    if (hasMore) {
      html += `<button class="btn-ghost" style="width: 100%; margin-top: 12px;" onclick="app.showAllSessions()">Show more sessions</button>`;
    }

    list.innerHTML = html;
  }

  showAllSessions() {
    const allSessions = getSessions().reverse();
    const list = document.getElementById('session-list');
    if (!list) return;

    const html = allSessions
      .map(s => {
        const ex = exercises.find(e => e.id === s.exerciseId);
        return `<div class="session-item"><div><strong>${this.escapeHtml(ex ? ex.title : s.exerciseId)}</strong><span class="session-date">${s.date}</span></div><span class="session-duration">${Math.ceil(s.duration / 60)}m</span></div>`;
      })
      .join('');

    list.innerHTML = html;
  }

  renderMostHelpful() {
    const most = getMostUsedExercises(3);
    const container = document.getElementById('most-helpful');
    if (!container) return;

    if (most.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    const list = document.getElementById('most-helpful-list');
    if (!list) return;

    list.innerHTML = most
      .map(m => {
        const ex = exercises.find(e => e.id === m.exerciseId);
        return `<div class="session-item"><strong>${this.escapeHtml(ex ? ex.title : m.exerciseId)}</strong><span>${m.count} sessions</span></div>`;
      })
      .join('');
  }

  // ============================================
  // SETTINGS VIEW
  // ============================================

  renderSettings() {
    const settings = getSettings();

    const soundEl = document.getElementById('setting-sound');
    const motionEl = document.getElementById('setting-motion');
    const reminderEl = document.getElementById('setting-reminder');
    const reminderTimeEl = document.getElementById('setting-reminder-time');
    const reminderTimeRow = document.getElementById('reminder-time-row');

    if (soundEl) soundEl.checked = settings.sound;
    if (motionEl) motionEl.checked = settings.reducedMotion;
    if (reminderEl) reminderEl.checked = settings.reminderEnabled;
    if (reminderTimeEl) reminderTimeEl.value = settings.reminderTime;
    if (reminderTimeRow) {
      reminderTimeRow.style.display = settings.reminderEnabled ? 'flex' : 'none';
    }

    // Theme selector
    document.querySelectorAll('.theme-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === settings.theme);
    });
  }

  updateSetting(key, value) {
    const settings = getSettings();
    settings[key] = value;
    saveSettings(settings);

    if (key === 'reducedMotion') this.applyReducedMotion(value);
    if (key === 'sound') this.player.setSoundEnabled(value);
    if (key === 'reminderEnabled') {
      const row = document.getElementById('reminder-time-row');
      if (row) row.style.display = value ? 'flex' : 'none';
      if (value) this.setupReminder();
    }
  }

  setTheme(theme) {
    const settings = getSettings();
    settings.theme = theme;
    saveSettings(settings);
    this.applyTheme(theme);
    document.querySelectorAll('.theme-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
  }

  applyTheme(theme) {
    if (theme === 'auto') {
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  applyReducedMotion(enabled) {
    document.documentElement.setAttribute('data-reduced-motion', enabled ? 'true' : 'false');
  }

  exportData() {
    const json = exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'steady-data.json';
    a.click();
    URL.revokeObjectURL(url);
    markBackupDone();
    this.showToast('Data exported');
  }

  // ---- Backup Reminder System ----

  renderBackupBanner() {
    const banner = document.getElementById('backup-banner');
    if (!banner) return;
    banner.style.display = shouldShowBackupReminder() ? 'flex' : 'none';
  }

  exportAndMarkBackup() {
    this.exportData();
    markBackupDone();
    const banner = document.getElementById('backup-banner');
    if (banner) banner.style.display = 'none';
  }

  dismissBackup() {
    dismissBackupReminder();
    const banner = document.getElementById('backup-banner');
    if (banner) banner.style.display = 'none';
  }

  importData(input) {
    const file = input.files ? input.files[0] : null;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        // Basic schema validation
        const parsed = JSON.parse(reader.result);
        if (typeof parsed !== 'object' || parsed === null) {
          this.showToast('Invalid file format');
          return;
        }
        importAllData(reader.result);
        this.showToast('Data imported');
        this.renderCurrentView();
      } catch (e) {
        this.showToast('Import failed');
      }
    };
    reader.readAsText(file);
    input.value = '';
  }

  confirmClearData() {
    this.showModal('Clear All Data', 'This will permanently delete all your data. This cannot be undone.', () => {
      clearAllData();
      this.showToast('All data cleared');
      this.renderCurrentView();
    });
  }

  installPWA() {
    if (this.deferredInstallPrompt) {
      this.deferredInstallPrompt.prompt();
    }
  }

  // ============================================
  // ONBOARDING
  // ============================================

  onboardNext(step) {
    document.querySelectorAll('.onboarding-step').forEach(s => (s.style.display = 'none'));
    const stepEl = document.getElementById(`onboard-step-${step}`);
    if (stepEl) stepEl.style.display = 'flex';
    document.querySelectorAll('.step-dot').forEach(d => {
      d.classList.toggle('active', parseInt(d.dataset.step) <= step);
    });
  }

  toggleChip(el) {
    el.classList.toggle('active');
  }

  skipOnboarding() {
    saveProfile({ completed: true, preferredModalities: [], goals: [] });
    // Program-first: auto-start the challenge program
    this.ensureProgramStarted();
    const onboardingEl = document.getElementById('onboarding');
    if (onboardingEl) onboardingEl.style.display = 'none';
    this.renderHome();
  }

  completeOnboarding() {
    const modalities = Array.from(document.querySelectorAll('#modality-chips .chip.active')).map(c => c.dataset.value);
    const goals = Array.from(document.querySelectorAll('#goal-chips .chip.active')).map(c => c.dataset.value);
    saveProfile({ completed: true, preferredModalities: modalities, goals: goals });
    // Program-first: auto-start the challenge program
    this.ensureProgramStarted();
    const onboardingEl = document.getElementById('onboarding');
    if (onboardingEl) onboardingEl.style.display = 'none';
    this.renderHome();
  }

  // ============================================
  // SIGNAL TAP (RELIEF)
  // ============================================

  tapSignal(signalId) {
    saveCheckIn({ primarySignal: signalId, timestamp: Date.now() });
    const rec = getReliefRecommendation(signalId, exercises);
    if (rec) {
      this.recommendedExercise = rec;
      const recEl = document.getElementById('relief-rec');
      if (recEl) recEl.style.display = 'block';
      const titleEl = document.getElementById('rec-title');
      const durationEl = document.getElementById('rec-duration');
      if (titleEl) titleEl.textContent = rec.title;
      if (durationEl) durationEl.textContent = `${Math.ceil(rec.duration / 60)} min`;
    }
  }

  // ============================================
  // INSIGHTS (dormant — requires #insights-container in index.html)
  // TODO: Wire into home view when insights section is added to the UI
  // ============================================

  renderInsights() {
    const insights = getActiveInsights(2);
    const container = document.getElementById('insights-container');
    if (!container) return;

    if (insights.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = insights
      .map(
        ins => `
      <div class="insight-card" data-insight="${ins.id}">
        <div class="insight-content">
          <h4>${this.escapeHtml(ins.title)}</h4>
          <p>${this.escapeHtml(ins.message)}</p>
        </div>
        <button class="btn-icon insight-dismiss" onclick="app.dismissInsightCard('${ins.id}')" aria-label="Dismiss">
          <svg viewBox="0 0 24 24" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/></svg>
        </button>
      </div>
    `
      )
      .join('');
  }

  dismissInsightCard(id) {
    dismissInsight(id);
    this.renderInsights();
  }

  // ============================================
  // TOP EXERCISES (dormant — requires #top-exercises, #top-exercises-list in index.html)
  // TODO: Wire into home or progress view when top exercises section is added
  // ============================================

  renderTopExercises() {
    const top = getMostUsedExercises(3);
    const container = document.getElementById('top-exercises');
    if (!container) return;

    const list = document.getElementById('top-exercises-list');
    if (!list) return;

    if (top.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    list.innerHTML = top
      .map(t => {
        const ex = exercises.find(e => e.id === t.exerciseId);
        if (!ex) return '';
        return `<div class="exercise-card exercise-card--${ex.category}" onclick="app.launchPlayer('${ex.id}', '${ex.mode}')"><div class="exercise-card-content"><h4>${this.escapeHtml(ex.title)}</h4><span>${t.count} times</span></div></div>`;
      })
      .join('');
  }

  // ============================================
  // UTILITIES
  // ============================================

  showModal(title, message, onConfirm) {
    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const modal = document.getElementById('confirm-modal');

    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;
    if (modal) modal.style.display = 'flex';

    if (confirmBtn) {
      confirmBtn.onclick = () => {
        onConfirm();
        this.closeModal();
      };
    }

    // Focus the confirm button for keyboard accessibility
    if (confirmBtn) confirmBtn.focus();

    // Close on Escape key
    this._modalEscHandler = (e) => {
      if (e.key === 'Escape') this.closeModal();
    };
    document.addEventListener('keydown', this._modalEscHandler);

    // Close on backdrop click (deferred to avoid catching the originating click)
    if (modal) {
      this._modalBackdropHandler = (e) => {
        if (e.target === modal) this.closeModal();
      };
      requestAnimationFrame(() => {
        modal.addEventListener('click', this._modalBackdropHandler);
      });
    }
  }

  closeModal() {
    const modal = document.getElementById('confirm-modal');
    if (modal) {
      modal.style.display = 'none';
      if (this._modalBackdropHandler) {
        modal.removeEventListener('click', this._modalBackdropHandler);
        this._modalBackdropHandler = null;
      }
    }
    if (this._modalEscHandler) {
      document.removeEventListener('keydown', this._modalEscHandler);
      this._modalEscHandler = null;
    }
  }

  showToast(message) {
    const toast = document.getElementById('toast');
    const messageEl = document.getElementById('toast-message');

    if (!toast || !messageEl) return;

    messageEl.textContent = message;
    toast.style.display = 'block';
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.style.display = 'none';
      }, 300);
    }, 2000);
  }

  renderCurrentView() {
    this.renderView(this.currentView);
  }

  renderStepDots() {
    const count = this.player.getStepCount();
    const dots = document.getElementById('step-dots');
    if (!dots) return;

    const existing = dots.querySelectorAll('.step-progress__dot');
    if (existing.length === count) {
      // Reuse existing dots — just reset classes
      existing.forEach((dot, i) => {
        dot.classList.remove('active', 'completed');
        if (i === 0) dot.classList.add('active');
      });
      return;
    }

    // Only rebuild DOM when count actually changes
    dots.innerHTML = Array.from({ length: count }, (_, i) => `<div class="step-progress__dot ${i === 0 ? 'active' : ''}"></div>`).join('');
  }

  registerSW() {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        // Check for updates periodically (every 60 min)
        setInterval(() => {
          reg.update().catch(() => {});
        }, 60 * 60 * 1000);

        // Notify user when new SW is waiting
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showToast('Update available — refresh for latest version.');
            }
          });
        });
      })
      .catch(err => {
        console.warn('SW registration failed:', err.message);
      });
  }

  setupReminder() {
    const settings = getSettings();
    if (!settings.reminderEnabled || !('Notification' in window)) return;

    // Request permission if not granted
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Clear any existing reminder interval
    if (this._reminderInterval) {
      clearInterval(this._reminderInterval);
    }

    // Check every 60 seconds if it's time to remind
    this._reminderInterval = setInterval(() => {
      if (Notification.permission !== 'granted') return;

      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const reminderTime = settings.reminderTime || '09:00';

      if (currentTime === reminderTime) {
        // Check if already practiced today
        const today = now.toISOString().split('T')[0];
        const practice = getDailyPractice(today);
        if (!practice || !practice.completed) {
          new Notification('Steady', {
            body: 'Your daily training is ready.',
            icon: '/icons/icon-192.png',
            tag: 'steady-reminder', // Prevents duplicate notifications
          });
        }
      }
    }, 60000); // Check every minute
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Global error boundary — prevent unhandled errors from crashing the app
window.addEventListener('error', (e) => {
  console.error('Unhandled error:', e.error || e.message);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  e.preventDefault(); // Prevent default browser logging noise
});

// Initialize the app
const app = new SteadyApp();
window.app = app; // Expose for onclick handlers

export default app;
