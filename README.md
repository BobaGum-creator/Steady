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
├── styles.css          # Complete design system
├── manifest.json       # PWA manifest
├── sw.js               # Service worker (offline caching)
├── js/
│   ├── app.js          # Main app logic, routing, UI
│   ├── data.js         # Exercise definitions (11 exercises)
│   ├── storage.js      # localStorage abstraction
│   └── player.js       # Guided exercise timer/player
├── icons/
│   ├── icon-192.png    # PWA icon
│   ├── icon-512.png    # PWA icon (large)
│   └── favicon-32.png  # Favicon
└── README.md
```

**Stack:** Plain HTML, CSS, JavaScript (ES modules). No framework, no build step, no dependencies.

**Data:** All user data stored in `localStorage` with `steady_` prefix. Nothing leaves the device.

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

**Tier 2 — Moderate Evidence:**

5. **5-4-3-2-1 Grounding** (Stop the Spiral)
   - Multiple RCTs across diverse populations. Nursing students: anxiety reduced from 23% to 4% high anxiety. Children RCT (n=121): significant anxiety reduction.
   - Best for: spiraling thoughts, panic, dissociation

6. **Cognitive Defusion — Name the Story** (Unhook from Thoughts)
   - ACT framework: Hayes & Hofmann, 2017, World Psychiatry. 3 decades of RCT support for ACT.
   - Brief defusion exercises: moderate independent evidence.
   - Best for: rumination, looping thoughts

7. **Leaves on a Stream** (Let Thoughts Pass)
   - ACT-based visualization. Part of well-evidenced ACT protocol.
   - Best for: fighting against thoughts, mental overload

**Tier 3 — Emerging Evidence:**

8. **Orienting Response** (Look Around)
   - Porges, 2021, Frontiers in Integrative Neuroscience. Clinical practice evidence.
   - Best for: vague anxiety, feeling on edge, overstimulation

9. **Pendulation** (Tension and Ease)
   - Somatic Experiencing framework. Scoping review in Frontiers in Psychology (2021).
   - Best for: body tension patterns, somatic anxiety

10. **Neurogenic Tremor Release** (Shake It Off)
    - Pilot studies show promise. Berceli, 2009. Limited large-scale RCT evidence.
    - Best for: restlessness, accumulated tension

11. **Stress Reset Journal** (Quick Unload)
    - Structured expressive writing has moderate evidence base.
    - Best for: turning diffuse stress into actionable next steps

### Product decisions

- **11 exercises, 4 categories** (Breathwork, Body, Mind, Quick Tools)
- Evidence level is visible but not gatekeeping — all exercises are low-risk
- Every exercise works without headphones or special equipment
- Shortest exercise is 60 seconds, longest is 4 minutes
- "Emergency Calm" (physiological sigh) is one tap from the home screen
- No gamification, no streak shaming, no manipulative patterns
- Consistency tracking is present but forgiving

## QA Checklist

### Desktop (Chrome)
- [ ] App loads without console errors
- [ ] Home view shows stress slider, quick actions, status
- [ ] Stress slider updates value display on drag
- [ ] Check-in button saves and shows "Updated"
- [ ] "3-Minute Reset" navigates to player with resonant breathing
- [ ] "Emergency Calm" navigates to player with physiological sigh
- [ ] Library shows all 11 exercises
- [ ] Category filters work (All, Breathwork, Body, Mind, Quick)
- [ ] Clicking an exercise opens the player
- [ ] Player pre-screen shows 1-10 stress buttons
- [ ] Selecting stress and tapping "Begin" starts the exercise
- [ ] Timer counts up during exercise
- [ ] Progress bar fills during exercise
- [ ] Breathing circle animates for breathwork exercises
- [ ] Step instructions change as exercise progresses
- [ ] Pause/Resume works
- [ ] Skip advances to next step
- [ ] Restart resets the exercise
- [ ] ✕ back button stops exercise and returns home
- [ ] Post-exercise screen shows after completion
- [ ] Saving session stores data and returns home
- [ ] Journal view saves entries with all 3 fields
- [ ] Journal shows past entries
- [ ] History view shows stats, recent sessions, most helpful
- [ ] Settings toggles work (sound, reduced motion)
- [ ] Export data downloads JSON file
- [ ] Clear data (with confirmation) removes all data
- [ ] Service worker registers (check DevTools → Application → Service Workers)

### Mobile (Chrome on Android/iOS)
- [ ] App loads quickly on mobile
- [ ] Touch targets are large enough (44px minimum)
- [ ] Bottom nav tabs all work
- [ ] Stress slider works with touch
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

## V2 Improvements

### High Priority
- Audio cues (gentle chime for step transitions, optional voice guidance)
- Haptic feedback on step changes (vibration API)
- Custom breathing pace settings per exercise
- Daily reminder notification (opt-in, respectful)
- Better offline handling with IndexedDB
- Animated breathing guide with smoother transitions (requestAnimationFrame)
- Dark/light theme toggle

### Medium Priority
- Exercise recommendations based on stress level and time of day
- Weekly summary view with charts
- Export to CSV
- Customizable exercise durations
- Favorite/bookmark exercises
- Exercise description/rationale expandable section
- Onboarding flow (first visit only, very brief)

### Low Priority
- More exercises (box breathing, body scan, cold exposure breathing)
- Exercise scheduling/planning
- Share progress (optional, export image)
- Accessibility audit and WCAG AA compliance review
- Performance profiling and optimization
- i18n / localization support
