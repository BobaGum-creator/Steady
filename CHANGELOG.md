# Steady — Changelog

All notable changes to the Steady app are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/).

---

## [6.1.0] — 2026-03-13

### Added — MVP Completion
- **Signal-to-exercise relief flow**: Tapping a signal card now shows an inline exercise recommendation with Start button, scored by signal match, personal effectiveness data, and evidence level
- **Library mode filters**: New "Training" and "Relief" pills filter exercises by their mode tag
- **Practice-focused Progress view**: Stats grid now shows Practice Streak, This Week, Training (30-day count), and Longest Streak instead of generic session data
- **Relief recommendation engine**: `getReliefRecommendation(signalId)` replaces the old generic recommendation system

### Changed
- **Onboarding reframed**: Reduced from 4 steps to 3; new mission-first welcome step ("Train your nervous system to handle stress better"), removed stressor selection
- **Reminder notifications**: Messages updated to training-first tone ("Time for today's practice")
- **Share progress image**: Colors updated to match V5.1 palette, stats show practice streak instead of generic streak
- **Today status**: Simplified to just show session count (streak info lives on practice card)

### Fixed
- Empty icon divs in recent exercises, history items, and most-helpful cards — replaced with category-colored indicator bars
- Text checkmark in post-exercise completion screen replaced with SVG
- History items now have proper gap/flex layout with colored indicators

### Removed
- Dead `getRecommendation()` and `showRecommendation()` functions (~80 lines)
- Stale `recommendation-card` references

---

## [6.0.0] — 2026-03-13

### Added — Two-Mode System (Training + Relief)
- **Mission reframe**: App shifts from pure stress relief to resilience training
  - New tagline: "Train your resilience" (time-of-day variants: "Build your baseline" / "Wind down stronger")
  - Copy throughout reflects proactive training over reactive relief
- **Today's Practice card**: Primary home screen element — daily training door
  - Auto-selects a training exercise via day-of-year rotation
  - Avoids repeating recent practices (5-day lookback)
  - Shows exercise name, duration, and "why it matters" explanation
  - Tracks completion separately from general sessions
  - Visual completion state when done for the day
- **Practice streak**: Independent streak counter for daily practice consistency
  - Displayed on practice card header
  - Separate from general session streak
- **Exercise mode tags**: Every exercise now tagged as `'training'`, `'relief'`, or `'both'`
  - Training: PMR, Unhook from Thoughts, Let Thoughts Pass, Pendulation, Body Scan, Cold Reset
  - Relief: Emergency Calm, Stop the Spiral, Quick Unload
  - Both: 3-Minute Reset, Slow Down, Look Around, Shake It Off, Box Breathing
- **Relief section**: Signal grid and emergency calm moved under "Need relief now?" header
  - Reframed as the reactive door, secondary to daily practice
- **New storage functions**: `getTodayPractice()`, `completePractice()`, `getPracticeStreak()`, `getRecentPracticeIds()`
- **New data helpers**: `getTrainingExercises()`, `getReliefExercises()`

### Removed
- Old "3-Minute Reset" quick-action button from home (replaced by practice card)
- Recommendation card from home (practice card serves this purpose better)

---

## [5.1.0] — 2026-03-13

### Changed — Design Overhaul
- **Color palette**: Replaced GitHub-style blue/green with slate/sage/sand earth tones
  - Dark: charcoal slate backgrounds, sage green accent (#8fb591), desert tan secondary (#c4a57a)
  - Light: warm cream backgrounds (#f5f2ed), deeper sage (#4a6e4e), darker tan (#a08058)
- **All emojis removed** across every file — replaced with inline SVG icons
  - Signal cards: concentric circles (mind), parallel bars (body), sine wave (breath), double chevrons (pressure)
  - Navigation: minimal stroke SVGs (house, grid, pen, bars, sliders)
  - Exercise cards: emoji icon column replaced with category-colored side bar
  - Favorites: bookmark SVG replaces heart emoji
  - Category pills, buttons, theme toggles: plain text labels
- **Exercise cards redesigned**: removed icon column, added 6px left accent bar colored by category (green=breathwork, tan=body, grey=mind, terra cotta=quick)
- **Improved contrast**: muted text bumped from #5c5752 to #7a7570 for WCAG AA compliance
- **Button interaction states**: added hover, active, and disabled states for primary/secondary buttons
- **Card depth**: added subtle box shadows to cards for visual hierarchy
- **Success color differentiated** from accent (#9bc483 vs #8fb591)

### Fixed
- **Player view CSS bug**: `.player-view` had `display: flex !important` without `.active` qualifier, causing "Quick body check" to appear on every tab. Changed to `.player-view.active`.

---

## [5.0.0] — 2026-03-13

### Added — V5 Feature Set
- **Insight cards** on home screen (max 2, contextual, dismissible with 7-day cooldown)
  - Continuity card: shows yesterday's primary signal
  - Weekly summary: Sunday/Monday, requires 3+ sessions
  - Signal trend: compares this week vs last (5+ check-ins)
  - Best tool: recommends exercise for active signal (3+ sessions)
  - Streak card: shows when streak >= 3 or recently broken
  - Time pattern: compares morning/afternoon/evening relief (10+ sessions)
- **Signal history chart** on Progress tab (14-day dot grid, needs 3+ days of data)
- **Exercise report card** shown after saving if 2+ previous sessions exist for that exercise
- **Smart defaults** for pre-exercise signal check (auto-populated from home signal or last session)
- **Weekly summary** insight with session count, active days, best shift, top signal
- New file: `js/insights.js` — standalone insight engine with shouldShow/render/action pattern

### Changed
- Service worker cache bumped from `steady-v4` to `steady-v5`
- `insights.js` added to service worker shell assets
- Storage module: added `getCheckInHistory()`, `getDismissedInsights()`, `dismissInsight()`, `isWeeklySummaryDismissed()`, `dismissWeeklySummary()`

---

## [4.0.0] — 2026-03-12

### Added — V4 Signal System
- **4-signal state check** replacing single stress slider
  - Signals: Mind Speed, Body Tension, Breathing, Internal Pressure
  - Each signal has 3 levels (0=low, 1=moderate, 2=high)
- **Signal-aware recommendations**: exercises matched to active signal
- **Pre/post signal tracking**: measures shift per signal after exercise
- **Signal effectiveness analytics**: tracks which exercises best reduce each signal
- **Home signal grid**: tap to select what feels strongest, filters recommendations

### Changed
- Check-in format: `{ primarySignal, levels: {mind, body, breath, pressure} }` replaces `{ level: 0-4 }`
- Session format: `signalsBefore` and `signalsAfter` replace `stressBefore`/`stressAfter`
- Recommendation engine uses signal matching instead of generic scoring

---

## [3.0.0] — 2026-03-12

### Added — V3 Guided Experience
- **Onboarding flow**: 4-step setup (stressors, modalities, time preference, goals)
- **Narration layer**: animated step-by-step instructions during exercises
- **Outcome-based recommendations**: suggests exercises based on profile + history
- **Haptic feedback**: subtle vibration on interactions (where supported)
- **Step indicators**: dot-based progress during exercises

---

## [2.0.0] — 2026-03-12

### Added — V2 Polish
- **Theme toggle**: dark/light/auto modes
- **Favorites system**: bookmark exercises, dedicated "Saved" filter
- **Audio cues**: gentle sounds during exercise transitions
- **Weekly activity chart**: 7-day bar chart on Progress tab
- **Share progress**: generates shareable text summary
- **Daily reminders**: configurable notification time
- **Data export/import**: JSON backup and restore

---

## [1.0.0] — 2026-03-12

### Added — Initial Release
- Core PWA with offline support (service worker, manifest)
- 14 evidence-based exercises across 4 categories (Breathwork, Body, Mind, Quick)
- Guided exercise player with breathing animations
- Journal/Unload feature (3-prompt stress dump)
- Progress tracking with streak counter
- IndexedDB + localStorage dual-layer storage
- Mobile-first responsive design
