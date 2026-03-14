# Steady — Evidence-Based Stress Relief

A mobile-first PWA for daily stress relief and stress-capacity training. Open it, tap one button, begin relief. No accounts, no backend, no data leaves your device.

## Quick Start (Local)

```bash
cd steady
python3 -m http.server 8080
# Open http://localhost:8080 in Chrome
```

Or use any static file server (Node `npx serve`, VS Code Live Server, etc).

**Important:** You must serve via HTTP (not open as a file) for ES modules and service worker to work.

## Deploy to GitHub Pages

### 1. Create a GitHub repository

```bash
cd steady
git init
git add .
git commit -m "Initial commit: Steady v1.0"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/steady.git
git push -u origin main
```

### 2. Enable GitHub Pages

1. Go to your repo on GitHub
2. Settings → Pages
3. Source: "Deploy from a branch"
4. Branch: `main`, folder: `/ (root)`
5. Click Save
6. Wait 1-2 minutes for deployment

### 3. Access your app

Your app will be live at: `https://YOUR_USERNAME.github.io/steady/`

### 4. Install on your phone

1. Open the URL in Chrome on your phone
2. Wait a few seconds for the page to fully load
3. Chrome should show an "Add to Home Screen" banner, or:
   - Tap the ⋮ menu → "Add to Home Screen" or "Install App"
4. The app will appear as an icon on your home screen
5. It runs in standalone mode (no browser chrome)

## Architecture

```
steady/
├── index.html          # Single-page app shell
├── styles.css          # Complete design system (2400+ lines)
├── manifest.json       # PWA manifest
├── sw.js               # Service worker (offline caching)
├── js/
│   ├── app.js          # Main app logic, routing, UI (~1200 lines)
│   ├── data.js         # Exercise definitions (14 exercises)
│   ├── storage.js      # Dual-layer storage (localStorage + IndexedDB)
│   ├── idb.js          # IndexedDB abstraction layer
│   └── player.js       # Guided exercise timer/player
├── icons/
│   ├── icon-192.png    # PWA icon
│   ├── icon-512.png    # PWA icon (large)
│   └── favicon-32.png  # Favicon
└── README.md
```

**Stack:** Plain HTML, CSS, JavaScript (ES modules). No framework, no build step, no dependencies.

**Data:** All user data stored in localStorage (synchronous) with IndexedDB write-through for durability. `steady_` prefix for namespacing. Nothing leaves the device.

## Research Summary

### Exercises included and evidence basis

**Tier 1 — Strong Evidence:**

1. **Physiological Sigh / Cyclic Sigh** (Emergency Calm)
   - Balban et al., 2023, Cell Reports Medicine. RCT (n=111). 5 min/day of cyclic sighing improved mood and reduced physiological arousal more than mindfulness meditation.
   - Best for: acute stress, anxiety, agitation

2. **Resonant Paced Breathing** (3-Minute Reset)
   - 2023 meta-analysis in Mindfulness (31 studies, n=1133). ~5.5 breaths/min maximizes heart rate variability.
   - Laborde et al., 2022, Psychophysiology.
   - Best for: daily baseline regulation, nervous system downshifting

3. **Extended Exhale Breathing** (Slow Down)
   - Laborde et al., 2018, Frontiers in Psychology. Prolonged exhalation activates parasympathetic response.
   - Best for: feeling keyed up, pre-sleep

4. **Progressive Muscle Relaxation, Short Form** (Body Tension Reset)
   - Al Sudani et al., 2024, systematic review (46 studies, n=3402). Effective for stress, anxiety, depression, and sleep.
   - NCCIH: moderate evidence for pain and anxiety.
   - Best for: body tension, jaw/shoulder tension, bedtime

5. **Box Breathing** (V2)
   - Widely used in military, first-responder, and clinical contexts. Navy SEAL training programs.
   - Best for: focus, pre-performance, anxiety regulation

**Tier 2 — Moderate Evidence:**

6. **5-4-3-2-1 Grounding** (Stop the Spiral)
   - Multiple RCTs across diverse populations. Nursing students: anxiety reduced from 23% to 4% high anxiety. Children RCT (n=121): significant anxiety reduction.
   - Best for: spiraling thoughts, panic, dissociation

7. **Cognitive Defusion — Name the Story** (Unhook from Thoughts)
   - ACT framework: Hayes & Hofmann, 2017, World Psychiatry. 3 decades of RCT support for ACT.
   - Brief defusion exercises: moderate independent evidence.
   - Best for: rumination, looping thoughts

8. **Leaves on a Stream** (Let Thoughts Pass)
   - ACT-based visualization. Part of well-evidenced ACT protocol.
   - Best for: fighting against thoughts, mental overload

9. **Body Scan** (V2)
   - Core component of MBSR (Mindfulness-Based Stress Reduction). Kabat-Zinn, 1990.
   - Best for: body awareness, tension recognition, grounding

**Tier 3 — Emerging Evidence:**

10. **Orienting Response** (Look Around)
    - Porges, 2021, Frontiers in Integrative Neuroscience. Clinical practice evidence.
    - Best for: vague anxiety, feeling on edge, overstimulation

11. **Pendulation** (Tension and Ease)
    - Somatic Experiencing framework. Scoping review in Frontiers in Psychology (2021).
    - Best for: body tension patterns, somatic anxiety

12. **Neurogenic Tremor Release** (Shake It Off)
    - Pilot studies show promise. Berceli, 2009. Limited large-scale RCT evidence.
    - Best for: restlessness, accumulated tension

13. **Cold Exposure Breathing** (V2)
    - Wim Hof method studies. Emerging evidence for stress tolerance and immune response.
    - Best for: acute arousal, building stress resilience

14. **Stress Reset Journal** (Quick Unload)
    - Structured expressive writing has moderate evidence base.
    - Best for: turning diffuse stress into actionable next steps

### Product decisions

- **14 exercises, 4 categories** (Breathwork, Body, Mind, Quick Tools)
- Evidence level is visible but not gatekeeping — all exercises are low-risk
- Every exercise works without headphones or special equipment
- Shortest exercise is 60 seconds, longest is 4 minutes
- "Emergency Calm" (physiological sigh) is one tap from the home screen
- No gamification, no streak shaming, no manipulative patterns
- Consistency tracking is present but forgiving

## Version History

### V1.0 — Foundation

The complete MVP: a fully functional stress-relief PWA deployable to GitHub Pages.

- 11 evidence-based exercises across 4 categories (breathwork, body, mind, quick)
- Guided exercise player with timer, breathing circle animation, and step-by-step progression
- Daily stress check-in slider (1–10)
- Stress journal ("Unload") with 3-prompt structured format
- History/insights view with stats, recent sessions, and most helpful exercises
- Settings with sound toggle, reduced motion toggle, data export/import, and clear data
- Full PWA: service worker with stale-while-revalidate caching, app manifest, installable to home screen
- Hash-based SPA routing with 5-tab bottom navigation
- Mobile-first dark theme with CSS custom properties design system
- Callback-pattern player architecture (createPlayer with onStepChange/onTick/onComplete)
- localStorage persistence with `steady_` prefix namespacing

### V2.0 — Polish & Personalization

Feature additions that make the app feel more alive and personal.

- **Audio cues** — Web Audio API oscillator chimes for step transitions, completion, inhale/exhale (no audio files needed)
- **Dark/light theme toggle** — Three modes (dark, light, auto) with OS `prefers-color-scheme` media query detection
- **Favorite/bookmark exercises** — Heart toggle on each exercise card, "Favorites" filter category in library
- **Exercise recommendations** — Smart scoring on home screen based on stress level, time of day, favorites, and evidence tier
- **Weekly summary chart** — Bar chart showing last 7 days of activity in the history view
- **Share progress** — Canvas-generated 600×400 PNG image with stats; native Share API with download fallback
- **Daily reminder notifications** — Notification API with opt-in toggle and time picker in settings
- **More exercises** — Added box breathing (strong evidence), body scan (moderate), and cold exposure breathing (emerging) — now 14 total
- **IndexedDB offline storage** — Dual-layer persistence: localStorage for instant synchronous reads, IndexedDB for durable backup with automatic hydration/migration on startup
- **Service worker v2** — Updated cache manifest with idb.js; cache version bumped for clean upgrade

### V3.0 — Deeper Personalization & Richer Guidance

Makes the app learn from your usage and feel more guided during exercises.

- **Outcome-based recommendation engine** — Tracks per-exercise stress reduction history (avg reduction, consistency rate over 90 days); recommendations now prioritize exercises that actually work for you, with personalized reason text like "Works well for you (avg 2.3 point relief)"
- **Onboarding flow** — 4-step first-launch questionnaire: primary stressors, preferred modalities, available time (1/3/5/10 min), and goals (calm down, build resilience, sleep better). Profile is saved and immediately influences recommendation scoring. Skip available on step 1.
- **Narration layer** — Player instructions now animate with fade-out-up → fade-in-up transitions between steps. Step type hints appear below instructions ("Take your time" for prompts, countdown for longer steps, "Continue at your own pace" for repeats). Visual step progress dots show your position through the exercise with a scaled-up current-step indicator.
- **Haptic feedback** — Five distinct vibration patterns via the Vibration API: tap (15ms, step transitions), inhale (triple-pulse ramp), exhale (gentle 12ms), hold (faint 5ms), and complete (double-pulse 30-60-30ms). All respect reduced motion settings and gracefully no-op on devices without vibration support.
- **Service worker v3** — Cache version bumped for clean upgrade

## V4 Roadmap

### High Priority
- Accessibility audit — full ARIA labels, screen reader testing, WCAG AA compliance review
- Background sync via service worker (queue writes when offline, sync when reconnected)
- Periodic IndexedDB cleanup of records older than 90 days
- Stress trend lines over 30/90 days on the progress view
- Before/after comparison charts showing which exercises produce the biggest stress delta per user

### Medium Priority
- Gratitude journaling as a new exercise category
- "Build your own routine" — chain 2-3 exercises into a custom sequence
- Curated playlists for scenarios (pre-meeting nerves, trouble sleeping, post-conflict cooldown)
- Monthly reflection prompt tied to journal system
- Time-of-day usage patterns ("you practice most at 9pm — here's something calming for evening")
- i18n / localization support

### Low Priority
- Custom breathing pace settings per exercise
- Exercise description/rationale expandable section in library
- Export to CSV
- Performance profiling and Lighthouse CI for automated quality checks
- Animated breathing guide with requestAnimationFrame for smoother 60fps transitions

## QA Checklist

### Desktop (Chrome)
- [ ] App loads without console errors
- [ ] Onboarding overlay appears on first visit (no prior data)
- [ ] Onboarding chips toggle selection, time picker works, profile saves
- [ ] Skipping onboarding saves profile as completed
- [ ] Home view shows stress slider, quick actions, recommendation card, status
- [ ] Recommendation card shows personalized reason text
- [ ] Stress slider updates value display on drag
- [ ] Check-in button saves and shows "Updated"
- [ ] "3-Minute Reset" navigates to player with resonant breathing
- [ ] "Emergency Calm" navigates to player with physiological sigh
- [ ] Library shows all 14 exercises
- [ ] Category filters work (All, Favorites, Breathwork, Body, Mind, Quick)
- [ ] Favorites toggle works (heart button on each card)
- [ ] Clicking an exercise opens the player
- [ ] Player pre-screen shows 1-10 stress buttons
- [ ] Selecting stress and tapping "Begin" starts the exercise
- [ ] Step instruction text animates between steps (narration layer)
- [ ] Step progress dots update with current position highlighted
- [ ] Step type hints show below instructions where applicable
- [ ] Timer counts up during exercise
- [ ] Progress bar fills during exercise
- [ ] Breathing circle animates for breathwork exercises
- [ ] Audio chimes play on step transitions (if sound enabled)
- [ ] Pause/Resume works
- [ ] Skip advances to next step
- [ ] Restart resets the exercise
- [ ] ✕ back button stops exercise and returns home
- [ ] Post-exercise screen shows after completion
- [ ] Saving session stores data and returns home
- [ ] Journal view saves entries with all 3 fields
- [ ] Journal shows past entries
- [ ] History view shows stats, weekly chart, recent sessions, most helpful
- [ ] Share progress generates image and opens share/download
- [ ] Settings: sound, reduced motion, theme (dark/light/auto), reminder toggles all work
- [ ] Theme toggle switches between dark, light, and auto modes
- [ ] Export data downloads JSON file
- [ ] Clear data (with confirmation) removes all data
- [ ] Service worker registers (check DevTools → Application → Service Workers)
- [ ] IndexedDB "steady" database created (check DevTools → Application → IndexedDB)

### Mobile (Chrome on Android/iOS)
- [ ] App loads quickly on mobile
- [ ] Touch targets are large enough (44px minimum)
- [ ] Bottom nav tabs all work
- [ ] Stress slider works with touch
- [ ] Haptic feedback triggers on breathing steps and step transitions (Android)
- [ ] Can complete a full exercise flow on phone
- [ ] Text is readable without zooming
- [ ] No horizontal scroll
- [ ] Player view takes full screen (no bottom nav)
- [ ] Breathing circle animation is smooth
- [ ] Manifest detected (Chrome DevTools → Application → Manifest)
- [ ] "Add to Home Screen" prompt appears or is available via menu
- [ ] App opens in standalone mode after installation
- [ ] App works after closing and reopening
- [ ] Offline: app loads basic shell without network
