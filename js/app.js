/**
 * Steady - Main Application Module
 *
 * Orchestrates all views, handles routing, wires up player, storage, and data modules.
 * Manages the complete user experience from check-ins through exercises to progress tracking.
 */

import { exercises, getExercise, getExercisesByCategory, categories } from './data.js';
import * as storage from './storage.js';
import { createPlayer } from './player.js';

// ============================================================================
// STATE & CONFIGURATION
// ============================================================================

// Global app state
const appState = {
  currentView: 'home',
  currentExerciseId: null,
  player: null,
  preStressRating: null,
  postStressRating: null,
  journalEntries: [],
  deferredPrompt: null,
};

// Color-coded evidence levels
const EVIDENCE_COLORS = {
  strong: '#10b981',
  moderate: '#f59e0b',
  emerging: '#6366f1',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format seconds to MM:SS format
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted time string
 */
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format seconds to M:SS or MM:SS format
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted time string
 */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * Get current time of day for contextual messaging
 * @returns {string} 'morning' | 'afternoon' | 'evening'
 */
function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

/**
 * Shorthand for getElementById
 * @param {string} id - Element ID
 * @returns {HTMLElement|null}
 */
function $(id) {
  return document.getElementById(id);
}

/**
 * Show a brief toast notification at the bottom of the screen
 * @param {string} message - Message to display
 * @param {number} duration - Duration in ms (default: 3000)
 */
function showToast(message, duration = 3000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 1000;
    font-size: 14px;
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Get day name from date string (YYYY-MM-DD)
 * @param {string} dateStr - Date string
 * @returns {string} Day name (e.g., "Monday")
 */
function getDayName(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Format date string for display
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} Formatted date (e.g., "Today" or "Mon, Jan 15")
 */
function formatDateDisplay(dateStr) {
  const today = storage.getToday();
  if (dateStr === today) return 'Today';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  if (dateStr === yesterdayStr) return 'Yesterday';

  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================================================
// SERVICE WORKER REGISTRATION
// ============================================================================

/**
 * Register the service worker for offline support and caching
 */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.log('Service Worker registration failed:', error);
    });
  }
}

// ============================================================================
// PWA INSTALL PROMPT
// ============================================================================

/**
 * Handle PWA install prompt
 */
function setupPWAInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event for later use
    appState.deferredPrompt = e;
    // Show the install button
    const installBtn = $('btn-install');
    if (installBtn) {
      installBtn.style.display = 'block';
    }
  });

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    console.log('Steady was installed');
    appState.deferredPrompt = null;
    const installBtn = $('btn-install');
    if (installBtn) {
      installBtn.style.display = 'none';
    }
  });

  // Set up install button click handler
  const installBtn = $('btn-install');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!appState.deferredPrompt) return;

      appState.deferredPrompt.prompt();
      const { outcome } = await appState.deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      appState.deferredPrompt = null;
    });
  }
}

// ============================================================================
// NAVIGATION & ROUTING
// ============================================================================

/**
 * Navigate to a specific view
 * @param {string} viewName - View name: 'home', 'library', 'player', 'journal', 'history', 'settings'
 */
function navigate(viewName) {
  // Hide all views
  document.querySelectorAll('.view').forEach((view) => {
    view.classList.remove('active');
  });

  // Show target view
  const targetView = $(`view-${viewName}`);
  if (targetView) {
    targetView.classList.add('active');
  }

  // Update nav tabs active state
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.classList.remove('active');
  });
  const activeTab = document.querySelector(`[data-view="${viewName}"]`);
  if (activeTab) {
    activeTab.classList.add('active');
  }

  // Hide bottom nav when in player view
  const bottomNav = $('bottom-nav');
  if (bottomNav) {
    bottomNav.style.display = viewName === 'player' ? 'none' : 'flex';
  }

  // Update app state
  appState.currentView = viewName;

  // Call view-specific setup
  if (viewName === 'home') initHome();
  if (viewName === 'library') initLibrary();
  if (viewName === 'journal') initJournal();
  if (viewName === 'history') initHistory();
  if (viewName === 'settings') initSettings();
}

/**
 * Set up navigation event listeners
 */
function setupNavigation() {
  // Bottom nav tabs
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const viewName = tab.getAttribute('data-view');
      navigate(viewName);
    });
  });

  // Hash-based routing support (optional, for bookmarking)
  window.addEventListener('hashchange', () => {
    const hash = location.hash.slice(1);
    if (hash.startsWith('player/')) {
      const exerciseId = hash.split('/')[1];
      startExercise(exerciseId);
    } else if (hash) {
      navigate(hash);
    }
  });
}

// ============================================================================
// HOME VIEW
// ============================================================================

/**
 * Initialize and populate the home view
 */
function initHome() {
  // Set contextual tagline
  const timeOfDay = getTimeOfDay();
  const taglineEl = $('home-tagline');
  if (taglineEl) {
    const taglines = {
      morning: 'Start your day grounded.',
      afternoon: 'Take a minute to reset.',
      evening: 'Wind down.',
    };
    taglineEl.textContent = taglines[timeOfDay] || 'Your daily reset.';
  }

  // Set up stress slider
  setupStressSlider();

  // Set up check-in button
  setupCheckInButton();

  // Set up quick action buttons
  const btn3min = $('btn-3min-reset');
  if (btn3min) {
    btn3min.addEventListener('click', () => {
      startExercise('resonant-breathing');
    });
  }

  const btnEmergency = $('btn-emergency');
  if (btnEmergency) {
    btnEmergency.addEventListener('click', () => {
      startExercise('physiological-sigh');
    });
  }

  // Update today's status
  updateTodayStatus();

  // Update recent/favorite exercises
  updateRecentExercises();
}

/**
 * Set up stress slider in home view
 */
function setupStressSlider() {
  const slider = $('stress-slider');
  const valueDisplay = $('stress-value');

  if (!slider || !valueDisplay) return;

  slider.addEventListener('input', (e) => {
    valueDisplay.textContent = e.target.value;
  });

  // Load today's check-in if it exists
  const todayCheckIn = storage.getTodayCheckIn();
  if (todayCheckIn) {
    slider.value = todayCheckIn.level;
    valueDisplay.textContent = todayCheckIn.level;
  }
}

/**
 * Set up check-in button in home view
 */
function setupCheckInButton() {
  const slider = $('stress-slider');
  const btn = $('checkin-save');

  if (!slider || !btn) return;

  const todayCheckIn = storage.getTodayCheckIn();
  if (todayCheckIn) {
    btn.textContent = 'Update';
  }

  btn.addEventListener('click', () => {
    const level = parseInt(slider.value);
    storage.saveCheckIn(level);
    btn.textContent = 'Updated';

    setTimeout(() => {
      btn.textContent = 'Update';
    }, 2000);

    showToast(`Checked in: ${level}/10 stress`);

    // Update tagline if high stress
    if (level >= 7) {
      const taglineEl = $('home-tagline');
      if (taglineEl) {
        taglineEl.textContent = "Let's bring that down.";
      }
    }
  });
}

/**
 * Update the today's status section
 */
function updateTodayStatus() {
  const statusEl = $('today-status');
  if (!statusEl) return;

  const todaySessions = storage.getTodaySessions();
  const streak = storage.getStreak();

  let statusHTML = '';

  // Sessions completed today
  if (todaySessions.length > 0) {
    statusHTML += `<p class="status-line">✓ You've done <strong>${todaySessions.length}</strong> exercise(s) today</p>`;
  } else {
    statusHTML += '<p class="status-line">Ready when you are.</p>';
  }

  // Streak info
  if (streak.current > 0) {
    statusHTML += `<p class="status-line">🔥 <strong>${streak.current}</strong> days consistent</p>`;
  } else if (streak.longest > 0) {
    statusHTML += '<p class="status-line">Welcome back.</p>';
  } else {
    statusHTML += '<p class="status-line">Start your first exercise below.</p>';
  }

  statusEl.innerHTML = statusHTML;
}

/**
 * Update the recent/favorite exercises section
 */
function updateRecentExercises() {
  const recentList = $('recent-list');
  if (!recentList) return;

  const mostUsed = storage.getMostUsedExercises(30);
  const topThree = mostUsed.slice(0, 3);

  if (topThree.length === 0) {
    $('recent-section').style.display = 'none';
    return;
  }

  $('recent-section').style.display = 'block';

  recentList.innerHTML = topThree.map((item) => {
    const exercise = getExercise(item.exerciseId);
    if (!exercise) return '';

    return `
      <div class="recent-card" data-exercise-id="${exercise.id}">
        <div class="recent-icon">${exercise.icon}</div>
        <div class="recent-info">
          <div class="recent-title">${exercise.title}</div>
          <div class="recent-meta">${item.count}x • ${item.avgStressReduction.toFixed(1)} point relief</div>
        </div>
      </div>
    `;
  }).join('');

  // Add click handlers
  document.querySelectorAll('.recent-card').forEach((card) => {
    card.addEventListener('click', () => {
      const exerciseId = card.getAttribute('data-exercise-id');
      startExercise(exerciseId);
    });
  });
}

// ============================================================================
// LIBRARY VIEW
// ============================================================================

/**
 * Initialize and populate the library view
 */
function initLibrary() {
  setupCategoryFilters();
  populateExerciseList('all');
}

/**
 * Set up category filter pills
 */
function setupCategoryFilters() {
  const pills = document.querySelectorAll('.category-pills .pill');

  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      pills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');

      const category = pill.getAttribute('data-category');
      populateExerciseList(category);
    });
  });
}

/**
 * Populate the exercise list, optionally filtered by category
 * @param {string} category - Category ID or 'all'
 */
function populateExerciseList(category) {
  const list = $('exercise-list');
  if (!list) return;

  let filteredExercises = exercises;
  if (category !== 'all') {
    filteredExercises = getExercisesByCategory(category);
  }

  list.innerHTML = filteredExercises.map((ex) => `
    <div class="exercise-card" data-exercise-id="${ex.id}">
      <div class="exercise-card-icon">${ex.icon}</div>
      <div class="exercise-card-body">
        <h3>${ex.title}</h3>
        <p>${ex.subtitle}</p>
        <div class="exercise-card-meta">
          <span class="duration-badge">${formatDuration(ex.duration)}</span>
          <span class="evidence-badge evidence-${ex.evidenceLevel}">${ex.evidenceLevel}</span>
        </div>
      </div>
    </div>
  `).join('');

  // Add click handlers
  document.querySelectorAll('.exercise-card').forEach((card) => {
    card.addEventListener('click', () => {
      const exerciseId = card.getAttribute('data-exercise-id');
      startExercise(exerciseId);
    });
  });
}

// ============================================================================
// PLAYER VIEW
// ============================================================================

/**
 * Start an exercise by ID
 * @param {string} exerciseId - ID of the exercise to start
 */
function startExercise(exerciseId) {
  const exercise = getExercise(exerciseId);
  if (!exercise) return;

  appState.currentExerciseId = exerciseId;
  appState.preStressRating = null;
  appState.postStressRating = null;
  appState.journalEntries = [];

  // Navigate to player view
  navigate('player');

  // Set up player
  setupPlayerView(exercise);
}

/**
 * Set up the player view for an exercise
 * @param {Object} exercise - Exercise data object
 */
function setupPlayerView(exercise) {
  // Set title
  const titleEl = $('player-title');
  if (titleEl) {
    titleEl.textContent = exercise.title;
  }

  // Show pre-stress section
  const preSection = $('player-pre');
  const mainSection = $('player-main');
  const postSection = $('player-post');

  if (preSection) preSection.style.display = 'block';
  if (mainSection) mainSection.style.display = 'none';
  if (postSection) postSection.style.display = 'none';

  // Generate stress rating buttons
  generateStressButtons('pre-stress-select');
  generateStressButtons('post-stress-select');

  // Set up start button
  setupPlayerStartButton(exercise);

  // Set up back button
  setupPlayerBackButton();

  // Reset timer
  const timerEl = $('player-timer');
  if (timerEl) {
    timerEl.textContent = '0:00';
  }
}

/**
 * Generate 1-10 stress rating buttons in a container
 * @param {string} containerId - ID of the container
 */
function generateStressButtons(containerId) {
  const container = $(containerId);
  if (!container) return;

  container.innerHTML = '';
  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.className = 'stress-btn';
    btn.textContent = i;
    btn.addEventListener('click', () => {
      document.querySelectorAll(`#${containerId} .stress-btn`).forEach((b) => {
        b.classList.remove('selected');
      });
      btn.classList.add('selected');

      if (containerId === 'pre-stress-select') {
        appState.preStressRating = i;
      } else if (containerId === 'post-stress-select') {
        appState.postStressRating = i;
      }
    });
    container.appendChild(btn);
  }
}

/**
 * Set up the "Begin" button in the pre-exercise screen
 * @param {Object} exercise - Exercise data object
 */
function setupPlayerStartButton(exercise) {
  const startBtn = $('player-start-btn');
  if (!startBtn) return;

  startBtn.onclick = () => {
    if (appState.preStressRating === null) {
      showToast('Please select your stress level');
      return;
    }

    // Hide pre, show main
    const preSection = $('player-pre');
    const mainSection = $('player-main');
    if (preSection) preSection.style.display = 'none';
    if (mainSection) mainSection.style.display = 'block';

    // Create and start player
    initializePlayer(exercise);
  };
}

/**
 * Initialize and start the player with an exercise
 * @param {Object} exercise - Exercise data object
 */
function initializePlayer(exercise) {
  // Clean up any existing player
  if (appState.player) {
    appState.player.stop();
  }

  // Create new player
  appState.player = createPlayer({
    onStepChange: (step, index, total) => {
      handlePlayerStepChange(step, index, total, exercise);
    },
    onTick: (elapsed, stepElapsed, stepDuration) => {
      handlePlayerTick(elapsed, stepElapsed, stepDuration, exercise);
    },
    onComplete: () => {
      handlePlayerComplete(exercise);
    },
  });

  // Set up player controls
  setupPlayerControls();

  // Check if this is a journal exercise
  if (exercise.id === 'stress-journal') {
    setupJournalExerciseMode(exercise);
  } else {
    // Normal breathing/body exercise
    setupNormalExerciseMode(exercise);
  }

  // Start the player
  appState.player.start(exercise);
}

/**
 * Handle step changes in the player
 * @param {Object} step - Current step
 * @param {number} index - Step index
 * @param {number} total - Total steps
 * @param {Object} exercise - Exercise data
 */
function handlePlayerStepChange(step, index, total, exercise) {
  const instructionEl = $('player-instruction');
  const progressTextEl = $('progress-text');
  const breathCircleWrap = $('breath-circle-wrap');
  const breathCircle = $('breath-circle');
  const breathLabel = $('breath-label');

  if (instructionEl) {
    instructionEl.textContent = step.instruction;
  }

  if (progressTextEl) {
    progressTextEl.textContent = `Step ${index + 1} of ${total}`;
  }

  // Handle breathing animation
  if (exercise.id !== 'stress-journal') {
    if (step.type.startsWith('breathe') || step.type === 'hold') {
      if (breathCircleWrap) breathCircleWrap.style.display = 'block';

      if (breathCircle) {
        breathCircle.classList.remove('inhale', 'exhale', 'hold');
        if (step.type === 'breathe-in') {
          breathCircle.classList.add('inhale');
          if (breathLabel) breathLabel.textContent = 'Breathe In';
        } else if (step.type === 'breathe-out') {
          breathCircle.classList.add('exhale');
          if (breathLabel) breathLabel.textContent = 'Breathe Out';
        } else if (step.type === 'hold') {
          breathCircle.classList.add('hold');
          if (breathLabel) breathLabel.textContent = 'Hold';
        }
      }
    } else {
      if (breathCircleWrap) breathCircleWrap.style.display = 'none';
    }
  }

  // Handle user-paced (duration === null) steps
  if (step.duration === null && step.type !== 'repeat') {
    const controls = $('player-controls');
    if (controls && !controls.querySelector('.next-btn')) {
      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn btn-primary next-btn';
      nextBtn.textContent = 'Next →';
      nextBtn.addEventListener('click', () => {
        appState.player.skip();
      });
      controls.appendChild(nextBtn);
    }
  } else {
    const nextBtn = document.querySelector('.next-btn');
    if (nextBtn) nextBtn.remove();
  }
}

/**
 * Handle player tick (timing updates)
 * @param {number} elapsed - Total elapsed seconds
 * @param {number} stepElapsed - Step elapsed seconds
 * @param {number} stepDuration - Step duration (or null)
 * @param {Object} exercise - Exercise data
 */
function handlePlayerTick(elapsed, stepElapsed, stepDuration, exercise) {
  // Update timer
  const timerEl = $('player-timer');
  if (timerEl) {
    timerEl.textContent = formatTime(elapsed);
  }

  // Update progress bar
  const progressFill = $('progress-fill');
  if (progressFill && exercise.duration) {
    const percentage = (elapsed / exercise.duration) * 100;
    progressFill.style.width = `${Math.min(percentage, 100)}%`;
  }
}

/**
 * Handle player completion
 * @param {Object} exercise - Exercise data
 */
function handlePlayerComplete(exercise) {
  // Hide main, show post
  const mainSection = $('player-main');
  const postSection = $('player-post');

  if (mainSection) mainSection.style.display = 'none';
  if (postSection) postSection.style.display = 'block';

  // Set up post-exercise buttons
  const saveBtn = $('player-save');
  const skipSaveBtn = $('player-skip-save');

  if (saveBtn) {
    saveBtn.onclick = () => {
      if (appState.postStressRating === null) {
        showToast('Please rate your stress level');
        return;
      }

      const state = appState.player.getState();
      const sessionData = {
        stressBefore: appState.preStressRating,
        stressAfter: appState.postStressRating,
        completed: true,
        duration: state.elapsed,
      };

      storage.saveSession(exercise.id, sessionData);

      // Save journal entries if this was a journal exercise
      if (exercise.id === 'stress-journal' && appState.journalEntries.length > 0) {
        appState.journalEntries.forEach((entry) => {
          storage.saveJournalEntry(entry);
        });
      }

      showToast('Session saved!');
      navigate('home');
    };
  }

  if (skipSaveBtn) {
    skipSaveBtn.onclick = () => {
      navigate('home');
    };
  }
}

/**
 * Set up player control buttons (pause, restart, skip)
 */
function setupPlayerControls() {
  const pauseBtn = $('player-pause');
  const restartBtn = $('player-restart');
  const skipBtn = $('player-skip');

  if (pauseBtn) {
    pauseBtn.onclick = () => {
      if (appState.player.isPaused()) {
        appState.player.resume();
        pauseBtn.textContent = 'Pause';
      } else {
        appState.player.pause();
        pauseBtn.textContent = 'Resume';
      }
    };
  }

  if (restartBtn) {
    restartBtn.onclick = () => {
      appState.player.restart();
      const pauseBtn = $('player-pause');
      if (pauseBtn) pauseBtn.textContent = 'Pause';
    };
  }

  if (skipBtn) {
    skipBtn.onclick = () => {
      appState.player.skip();
    };
  }
}

/**
 * Set up the back button in player view
 */
function setupPlayerBackButton() {
  const backBtn = $('player-back');
  if (backBtn) {
    backBtn.onclick = () => {
      if (appState.player) {
        appState.player.stop();
      }
      navigate('home');
    };
  }
}

/**
 * Set up normal breathing/body exercise mode
 * @param {Object} exercise - Exercise data
 */
function setupNormalExerciseMode(exercise) {
  const journalInputs = $('journal-inputs');
  if (journalInputs) {
    journalInputs.style.display = 'none';
  }
}

/**
 * Set up journal exercise mode
 * @param {Object} exercise - Exercise data
 */
function setupJournalExerciseMode(exercise) {
  const journalInputs = $('journal-inputs');
  const textarea = $('journal-textarea');
  const nextBtn = $('journal-next');

  if (journalInputs) {
    journalInputs.style.display = 'block';
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      const text = textarea?.value.trim();
      if (!text) {
        showToast('Please write something');
        return;
      }

      // Get current step instruction to use as the field label
      const state = appState.player.getState();
      const stepIndex = state.stepIndex;
      const step = exercise.steps[stepIndex];

      // Store this entry
      const fieldLabels = [
        'stressor',
        'inControl',
        'nextStep',
      ];

      const fieldLabel = fieldLabels[stepIndex] || `field_${stepIndex}`;

      appState.journalEntries[stepIndex] = {
        field: fieldLabel,
        value: text,
      };

      // Clear textarea and advance
      if (textarea) textarea.value = '';

      // Skip to next step
      appState.player.skip();
    };
  }
}

// ============================================================================
// JOURNAL VIEW
// ============================================================================

/**
 * Initialize and populate the journal view
 */
function initJournal() {
  setupJournalForm();
  loadJournalEntries();
}

/**
 * Set up the journal form in the journal view
 */
function setupJournalForm() {
  const saveBtn = $('journal-save');
  if (saveBtn) {
    saveBtn.onclick = () => {
      const stressor = $('journal-stressor')?.value.trim();
      const inControl = $('journal-control')?.value.trim();
      const nextStep = $('journal-nextstep')?.value.trim();

      if (!stressor || !inControl || !nextStep) {
        showToast('Please fill in all fields');
        return;
      }

      try {
        storage.saveJournalEntry({
          stressor,
          inControl,
          nextStep,
        });

        // Clear form
        if ($('journal-stressor')) $('journal-stressor').value = '';
        if ($('journal-control')) $('journal-control').value = '';
        if ($('journal-nextstep')) $('journal-nextstep').value = '';

        showToast('Entry saved');
        loadJournalEntries();
      } catch (error) {
        showToast(`Error: ${error.message}`);
      }
    };
  }
}

/**
 * Load and display past journal entries
 */
function loadJournalEntries() {
  const entriesList = $('journal-entries-list');
  if (!entriesList) return;

  const entries = storage.getJournalEntries(30);

  if (entries.length === 0) {
    entriesList.innerHTML = '<p class="empty-state">No entries yet. Start by checking in on the home screen.</p>';
    return;
  }

  entriesList.innerHTML = entries.map((entry) => `
    <div class="journal-entry-card">
      <div class="entry-date">${formatDateDisplay(entry.date)}</div>
      <div class="entry-field">
        <span class="field-label">Stressor:</span>
        <p>${escapeHtml(entry.stressor)}</p>
      </div>
      <div class="entry-field">
        <span class="field-label">In Control:</span>
        <p>${escapeHtml(entry.inControl)}</p>
      </div>
      <div class="entry-field">
        <span class="field-label">Next Step:</span>
        <p>${escapeHtml(entry.nextStep)}</p>
      </div>
    </div>
  `).join('');
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================================
// HISTORY VIEW
// ============================================================================

/**
 * Initialize and populate the history view
 */
function initHistory() {
  updateHistoryStats();
  populateRecentSessions();
  populateMostHelpful();
}

/**
 * Update statistics in the history view
 */
function updateHistoryStats() {
  const statsGrid = $('stats-grid');
  if (!statsGrid) return;

  const streak = storage.getStreak();
  const sessions = storage.getTodaySessions();
  const recentSessions = storage.getRecentSessions(7);

  // Calculate average stress reduction
  let avgStressReduction = 0;
  let ratedSessions = 0;
  recentSessions.forEach((session) => {
    if (typeof session.stressBefore === 'number' && typeof session.stressAfter === 'number') {
      avgStressReduction += session.stressBefore - session.stressAfter;
      ratedSessions += 1;
    }
  });
  if (ratedSessions > 0) {
    avgStressReduction /= ratedSessions;
  }

  const statsHTML = `
    <div class="stat-card">
      <div class="stat-label">Current Streak</div>
      <div class="stat-value">${streak.current}</div>
      <div class="stat-unit">days</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">This Week</div>
      <div class="stat-value">${recentSessions.length}</div>
      <div class="stat-unit">sessions</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Avg Relief</div>
      <div class="stat-value">${avgStressReduction > 0 ? '+' : ''}${avgStressReduction.toFixed(1)}</div>
      <div class="stat-unit">points</div>
    </div>
  `;

  statsGrid.innerHTML = statsHTML;
}

/**
 * Populate recent sessions list
 */
function populateRecentSessions() {
  const historyList = $('history-list');
  if (!historyList) return;

  const sessions = storage.getRecentSessions(30);

  if (sessions.length === 0) {
    historyList.innerHTML = '<p class="empty-state">No sessions yet. Start an exercise to see your history.</p>';
    return;
  }

  historyList.innerHTML = sessions.reverse().map((session) => {
    const exercise = getExercise(session.exerciseId);
    if (!exercise) return '';

    const stressChange = session.stressBefore - session.stressAfter;
    const stressChangeText = stressChange > 0
      ? `<span class="stress-positive">-${stressChange}</span>`
      : `<span class="stress-neutral">${stressChange}</span>`;

    return `
      <div class="history-item">
        <div class="history-icon">${exercise.icon}</div>
        <div class="history-info">
          <div class="history-title">${exercise.title}</div>
          <div class="history-date">${formatDateDisplay(session.date)}</div>
        </div>
        <div class="history-stress">
          ${typeof session.stressBefore === 'number' ? `${session.stressBefore} → ${session.stressAfter}` : 'No rating'}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Populate most helpful exercises
 */
function populateMostHelpful() {
  const mostHelpfulList = $('most-helpful-list');
  if (!mostHelpfulList) return;

  const mostUsed = storage.getMostUsedExercises(30);

  if (mostUsed.length === 0) {
    mostHelpfulList.innerHTML = '<p class="empty-state">Track sessions to see what works best for you.</p>';
    return;
  }

  mostHelpfulList.innerHTML = mostUsed.map((item) => {
    const exercise = getExercise(item.exerciseId);
    if (!exercise) return '';

    return `
      <div class="most-helpful-card" data-exercise-id="${exercise.id}">
        <div class="helpful-icon">${exercise.icon}</div>
        <div class="helpful-info">
          <div class="helpful-title">${exercise.title}</div>
          <div class="helpful-stats">${item.count}x • ${item.avgStressReduction.toFixed(1)} avg relief</div>
        </div>
      </div>
    `;
  }).join('');

  // Add click handlers
  document.querySelectorAll('.most-helpful-card').forEach((card) => {
    card.addEventListener('click', () => {
      const exerciseId = card.getAttribute('data-exercise-id');
      startExercise(exerciseId);
    });
  });
}

// ============================================================================
// SETTINGS VIEW
// ============================================================================

/**
 * Initialize and populate the settings view
 */
function initSettings() {
  const settings = storage.getSettings();

  // Sound toggle
  const soundToggle = $('setting-sound');
  if (soundToggle) {
    soundToggle.checked = settings.sound;
    soundToggle.addEventListener('change', (e) => {
      storage.saveSettings({ sound: e.target.checked });
    });
  }

  // Reduced motion toggle
  const motionToggle = $('setting-motion');
  if (motionToggle) {
    motionToggle.checked = settings.reducedMotion;
    motionToggle.addEventListener('change', (e) => {
      storage.saveSettings({ reducedMotion: e.target.checked });
      if (e.target.checked) {
        document.body.classList.add('reduced-motion');
      } else {
        document.body.classList.remove('reduced-motion');
      }
    });
  }

  // Export button
  const exportBtn = $('btn-export');
  if (exportBtn) {
    exportBtn.onclick = () => {
      const data = storage.exportAllData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `steady-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Data exported');
    };
  }

  // Import button
  const importBtn = $('btn-import');
  const importFile = $('import-file');
  if (importBtn && importFile) {
    importBtn.onclick = () => {
      importFile.click();
    };

    importFile.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonString = event.target?.result;
          if (typeof jsonString !== 'string') {
            showToast('Error reading file');
            return;
          }

          const result = storage.importData(jsonString);
          if (result.success) {
            showToast('Data imported successfully');
            // Refresh current view
            navigate(appState.currentView);
          } else {
            showToast(`Import error: ${result.error}`);
          }
        } catch (error) {
          showToast('Failed to import data');
        }
      };
      reader.readAsText(file);
    });
  }

  // Clear data button
  const clearBtn = $('btn-clear-data');
  if (clearBtn) {
    clearBtn.onclick = () => {
      if (confirm('Are you sure? This will delete all your data permanently.')) {
        storage.clearAllData();
        showToast('All data cleared');
        navigate('home');
      }
    };
  }
}

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================

/**
 * Initialize the application
 */
function initializeApp() {
  // Register service worker for offline support
  registerServiceWorker();

  // Set up PWA install support
  setupPWAInstall();

  // Set up navigation
  setupNavigation();

  // Load settings and apply
  const settings = storage.getSettings();
  if (settings.reducedMotion) {
    document.body.classList.add('reduced-motion');
  }

  // Navigate to home view on start
  navigate('home');
}

// ============================================================================
// ENTRY POINT
// ============================================================================

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
