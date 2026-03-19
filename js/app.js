// Steady App - Main Application Logic
// ES Module for hash-based SPA routing, no framework, plain JavaScript

import { exercises, challengeDayMap, intentionCategories, signalDefinitions, challengePhases, getCognitiveTierForDay, getDisruptionCountForDay } from './data.js';
import { ExercisePlayer, formatTime } from './player.js';
import {
  getSessions, addSession, saveDailyPractice, getDailyPractice,
  getStreak, getLongestStreak, getProfile, saveProfile, getSettings, saveSettings,
  getBookmarks, toggleBookmark, saveJournalEntry, getJournalEntries,
  saveReflection, getReflections, getChallengeProgram, saveChallengeProgram,
  advanceChallengeDay, isChallengeUnlocked, resetChallenge, getIntentionStats,
  saveCheckIn, getDismissedInsights, dismissInsight, exportAllData, importAllData,
  clearAllData, getWeeklyActivity, getMonthlySessionCount, getMostUsedExercises,
  getExerciseEffectiveness
} from './storage.js';
import { getActiveInsights, getReliefRecommendation } from './insights.js';
import { initDB, syncBackup } from './idb.js';

class SteadyApp {
  constructor() {
    this.player = new ExercisePlayer();
    this.currentView = 'home';
    this.currentFilter = 'all';
    this.selectedIntention = null;
    this.recommendedExercise = null;
    this.deferredInstallPrompt = null;
    this.playerMode = null;
    this.init();
  }

  async init() {
    // Initialize IDB backup
    await initDB();

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
  }

  // ============================================
  // ROUTING & NAVIGATION
  // ============================================

  setupRouting() {
    window.addEventListener('hashchange', () => this.handleRoute());
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
    // Streak display (top-right)
    const streak = getStreak();
    const streakEl = document.getElementById('home-streak');
    const streakCount = document.getElementById('home-streak-count');
    if (streakEl && streakCount) {
      if (streak > 0) {
        streakEl.style.display = 'flex';
        streakCount.textContent = `${streak} day${streak !== 1 ? 's' : ''}`;
      } else {
        streakEl.style.display = 'none';
      }
    }

    // Ensure challenge program is initialized (program-first approach)
    this.ensureProgramStarted();

    // Render the training hero block
    this.renderTrainingHero();
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
      if (descEl) descEl.textContent = exercise.subtitle;
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
    this.player.start(exerciseId);
    this.playerMode = mode;
    this.navigate('player');
    this.showPlayerPhase('precheck');
    this.renderSignalCheck('signal-check-before', {});
  }

  setupPlayerCallbacks() {
    this.player.onPhaseChange = (data) => {
      if (data.phase === 'pre-check') this.showPlayerPhase('precheck');
      else if (data.phase === 'intention') this.showPlayerPhase('intention');
      else if (data.phase === 'active') this.showPlayerPhase('active');
      else if (data.phase === 'post-check') this.showPlayerPhase('postcheck');
    };

    this.player.onStepChange = (data) => {
      this.renderActiveStep(data);
    };

    this.player.onStepTick = (data) => {
      // Update step progress if needed
    };

    this.player.onTimerTick = (data) => {
      const timerEl = document.getElementById('player-timer');
      const progressEl = document.getElementById('progress-fill');
      if (timerEl) timerEl.textContent = formatTime(data.remaining);
      if (progressEl) {
        const pct = (data.elapsed / data.duration) * 100;
        progressEl.style.width = `${pct}%`;
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
    }

    if (phase === 'intention') {
      this.renderIntentionChips();
    }

    if (phase === 'postcheck') {
      this.renderPostCheck();
    }
  }

  renderActiveStep(data) {
    const instruction = document.getElementById('step-instruction');
    const hint = document.getElementById('step-type-hint');
    const circle = document.getElementById('breathing-circle');

    if (instruction) instruction.textContent = data.step.instruction;

    // Step type hints
    const typeLabels = {
      'breathe-in': 'Breathe In',
      'breathe-out': 'Breathe Out',
      hold: 'Hold',
      'pressure-hold': 'Hold',
      prompt: '',
      timed: '',
      cognitive: 'Think',
      disruption: 'RESET'
    };
    if (hint) hint.textContent = typeLabels[data.step.type] || '';

    // Breathing circle animation
    if (circle) {
      circle.className = 'breathing-circle';
      if (data.breathingState === 'inhale') circle.classList.add('breathing-circle--inhale');
      else if (data.breathingState === 'exhale') circle.classList.add('breathing-circle--exhale');
      else if (data.breathingState === 'hold') circle.classList.add('breathing-circle--hold');
    }

    // Disruption effect
    if (data.step.type === 'disruption') {
      if (instruction) {
        instruction.classList.add('step--disruption');
        setTimeout(() => instruction.classList.remove('step--disruption'), 500);
      }
    }

    // Update step count
    const stepCountEl = document.getElementById('step-count');
    if (stepCountEl) stepCountEl.textContent = `Step ${data.index + 1} of ${data.total}`;
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

        const name = def ? def.name : sig;
        const levels = def ? def.levels : ['Low', 'Medium', 'High'];

        return `
        <div class="signal-row" data-signal="${sig}">
          <span class="signal-row-label">${name}</span>
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
    const container = document.getElementById(containerId);
    if (!container) return;
    const row = container.querySelector(`[data-signal="${signal}"]`);
    if (!row) return;
    row.querySelectorAll('.signal-level').forEach(btn => btn.classList.remove('signal-level--active'));
    const activeBtn = row.querySelector(`[data-level="${level}"]`);
    if (activeBtn) activeBtn.classList.add('signal-level--active');
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
    this.player.destroy();
    this.navigate('home');
  }

  renderPostCheck() {
    this.renderSignalCheck('signal-check-after', this.player.signalsBefore || {});
    this.renderShiftSummary();
  }

  renderShiftSummary() {
    const before = this.player.signalsBefore || {};
    const container = document.getElementById('shift-summary');
    if (!container) return;

    // Show only elevated signals
    const elevated = Object.entries(before).filter(([k, v]) => v > 0);
    if (elevated.length === 0) {
      container.innerHTML = '<p>Starting from a good place. Nice.</p>';
      return;
    }

    container.innerHTML = elevated
      .map(([sig, level]) => {
        let def;
        if (Array.isArray(signalDefinitions)) {
          def = signalDefinitions.find(s => s.id === sig);
        } else {
          def = signalDefinitions[sig];
        }
        const name = def ? def.name : sig;
        return `<div class="shift-item"><span>${name}</span><span>Level ${level}</span></div>`;
      })
      .join('');
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
    syncBackup();

    this.showToast('Session saved');
    this.navigate('home');
  }

  skipSave() {
    this.navigate('home');
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
    syncBackup();
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
    syncBackup();
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
    // Stats
    const statStreak = document.getElementById('stat-streak');
    const statWeek = document.getElementById('stat-week');
    const statMonth = document.getElementById('stat-month');
    const statLongest = document.getElementById('stat-longest');

    if (statStreak) statStreak.textContent = getStreak();
    if (statWeek) statWeek.textContent = getWeeklyActivity().reduce((s, d) => s + d.count, 0);
    if (statMonth) statMonth.textContent = getMonthlySessionCount();
    if (statLongest) statLongest.textContent = getLongestStreak();

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
    if (sessions.length < 2) return;

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
    const sessions = getSessions().slice(-10).reverse();
    const list = document.getElementById('session-list');
    if (!list) return;

    if (sessions.length === 0) {
      list.innerHTML = '<div class="empty-state">Complete your first exercise to see sessions here.</div>';
      return;
    }

    list.innerHTML = sessions
      .map(s => {
        const ex = exercises.find(e => e.id === s.exerciseId);
        return `<div class="session-item"><div><strong>${this.escapeHtml(ex ? ex.title : s.exerciseId)}</strong><span class="session-date">${s.date}</span></div><span class="session-duration">${Math.ceil(s.duration / 60)}m</span></div>`;
      })
      .join('');
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
    this.showToast('Data exported');
  }

  importData(input) {
    const file = input.files ? input.files[0] : null;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
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
  // INSIGHTS
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
        <button class="btn-icon insight-dismiss" onclick="app.dismissInsight('${ins.id}')" aria-label="Dismiss">
          <svg viewBox="0 0 24 24" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/></svg>
        </button>
      </div>
    `
      )
      .join('');
  }

  dismissInsight(id) {
    dismissInsight(id);
    this.renderInsights();
  }

  // ============================================
  // TOP EXERCISES
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
  }

  closeModal() {
    const modal = document.getElementById('confirm-modal');
    if (modal) modal.style.display = 'none';
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

    dots.innerHTML = Array.from({ length: count }, (_, i) => `<div class="step-dot ${i === 0 ? 'active' : ''}"></div>`).join('');
  }

  registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service worker registration failed, continue without it
      });
    }
  }

  setupReminder() {
    const settings = getSettings();
    if (!settings.reminderEnabled || !('Notification' in window)) return;
    Notification.requestPermission();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the app
const app = new SteadyApp();
window.app = app; // Expose for onclick handlers

export default app;
