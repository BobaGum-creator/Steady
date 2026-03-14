# Steady — Project Reference

Quick-reference doc for maintaining context across sessions.
Last updated: 2026-03-13 (V6.1)

---

## Mission

**Making resilience skills easier to learn and practice in everyday life.**

Stress is inevitable. Burnout is not. The goal is not to eliminate stress — it's to increase your ability to move between stress and recovery smoothly. Resilient individuals are not stress-free; they recover faster and more consistently.

## What Steady Is

A static single-page PWA for resilience training and stress relief. No framework, no build step — plain HTML/CSS/JS with ES modules. Runs entirely on-device; all data stays in the browser.

**Target user**: People (skewing male, 25-45) who want practical stress tools without the typical soft-wellness aesthetic. The design language is closer to a premium instrument than a meditation retreat.

### Two-Mode System (V6)

The app has two doors:

| Mode | Purpose | When | Primary UI |
|------|---------|------|------------|
| **Training** | Build resilience proactively | Daily, even on calm days | Today's Practice card |
| **Relief** | Calm the system reactively | When stressed | Signal grid + Emergency Calm |

Training builds the skill. Relief applies it. Both reinforce each other.

### Relief Flow (V6.1)

When a user taps a signal card ("Racing Mind", "Tight Body", etc.), the app scores all relief-mode exercises against that signal using signal match, personal effectiveness history, and evidence level — then shows an inline recommendation card with a Start button. This replaced the old generic recommendation engine.

### Library Modes (V6.1)

The exercise library now has Training and Relief filter pills alongside the category filters. These map to the `mode` property on each exercise (`'training'`, `'relief'`, `'both'`).

### Onboarding (V6.1)

Three-step flow: mission welcome → preferred modalities → goals. Framed around training ("Train your nervous system to handle stress better") rather than the old relief-first "What stresses you?".

---

## Architecture

```
steady/
├── index.html          # Single-page app shell, all views defined here
├── styles.css          # Complete stylesheet (~2850 lines), 22 sections
├── sw.js               # Service worker (stale-while-revalidate, cache: steady-v5)
├── manifest.json       # PWA manifest
├── js/
│   ├── app.js          # Main module (~1860 lines) — routing, views, player orchestration
│   ├── data.js         # 14 exercises, 4 categories, step definitions
│   ├── player.js       # createPlayer() factory — step sequencing, timers, breathing animation
│   ├── storage.js      # Dual-layer persistence (localStorage + IndexedDB)
│   ├── insights.js     # V5 insight engine — 6 card types with shouldShow/render/action
│   └── idb.js          # IndexedDB async wrapper
├── icons/              # PWA icons (various sizes)
├── CHANGELOG.md        # Version history
└── PROJECT.md          # This file
```

### Key Patterns

- **Hash routing**: `#home`, `#library`, `#player`, `#journal`, `#history`, `#settings`
- **View switching**: `.view { display: none }` / `.view.active { display: flex }`
- **Storage**: localStorage for sync reads, IndexedDB for async write-through backup
- **State**: `appState` object in app.js (currentView, currentExerciseId, player, preSignals, postSignals, activeSignal)

---

## Design System

### Color Palette (v5.1)

| Token | Dark | Light | Purpose |
|-------|------|-------|---------|
| `--bg-primary` | `#1a1d21` | `#f5f2ed` | Page background |
| `--bg-secondary` | `#21252a` | `#ebe8e2` | Nav, grouped sections |
| `--bg-card` | `#282d33` | `#ffffff` | Card surfaces |
| `--bg-elevated` | `#2f353c` | `#e5e2dc` | Elevated/hover states |
| `--border` | `#3a4149` | `#d1cdc6` | Borders, separators |
| `--text-primary` | `#e2dfd9` | `#2a2825` | Body text |
| `--text-secondary` | `#9b9690` | `#6b6660` | Secondary labels |
| `--text-muted` | `#7a7570` | `#9b9690` | Hints, timestamps |
| `--accent` | `#8fb591` | `#4a6e4e` | Primary actions, active states |
| `--success` | `#9bc483` | `#5a7e5e` | Positive outcomes |
| `--warning` | `#c4a57a` | `#a08058` | Desert tan secondary accent |
| `--danger` | `#c2685e` | `#b05a50` | Destructive actions |
| `--breathe-in` | `#8fb591` | `#4a6e4e` | Inhale animation |
| `--breathe-out` | `#c4a57a` | `#a08058` | Exhale animation |

### Signal System

4 signals, each with 3 levels (0=low, 1=moderate, 2=high):

| Signal | ID | Levels | SVG Icon |
|--------|-----|--------|----------|
| Mind Speed | `mind` | Calm / Busy / Racing | Concentric circles |
| Body Tension | `body` | Loose / Tight / Locked | Parallel vertical bars |
| Breathing | `breath` | Deep / Shallow / Stuck | Sine wave |
| Internal Pressure | `pressure` | Settled / Uneasy / Intense | Double chevrons |

### Icon System

All icons are inline SVGs — no emoji, no icon font, no external sprites.
- **Nav**: Stroke-based, 20×20, `stroke-width: 1.5`
- **Signal cards**: 28×28, geometric/abstract
- **Signal row labels**: 18×18 inline with text
- **Exercise cards**: No icon — thin left accent bar colored by category
- **Favorites**: Bookmark path (`M5 4h14v16l-7-4-7 4V4z`), filled when active

### Category Colors

| Category | Exercise bar color | Mapping |
|----------|-------------------|---------|
| Breathwork | `var(--accent)` | Sage green |
| Body | `var(--warning)` | Desert tan |
| Mind | `var(--text-secondary)` | Warm grey |
| Quick | `var(--danger)` | Terra cotta |

---

## Data Model

### Check-in (daily)
```json
{ "primarySignal": "mind", "levels": { "mind": 2, "body": 1, "breath": 1, "pressure": 0 }, "timestamp": 1710000000 }
```

### Session (per exercise)
```json
{ "exerciseId": "box-breathing", "date": "2026-03-13", "duration": 180, "completed": true,
  "signalsBefore": { "mind": 2, "body": 1, "breath": 1, "pressure": 1 },
  "signalsAfter": { "mind": 0, "body": 0, "breath": 0, "pressure": 0 },
  "timestamp": 1710000000 }
```

### Journal Entry
```json
{ "stressor": "...", "control": "...", "nextStep": "...", "date": "2026-03-13", "timestamp": 1710000000 }
```

---

## V5 Insight System

Each insight has `id`, `priority` (lower = shown first), `shouldShow(data)`, `render(data)`, `action`.
`getInsights(data)` returns top 2 passing cards, excluding dismissed (7-day cooldown).

| Insight | Priority | Trigger | Min Data |
|---------|----------|---------|----------|
| Continuity | 1 | Yesterday had check-in, today doesn't yet | 1 prior check-in |
| Weekly Summary | 2 | Sunday or Monday | 3+ sessions that week |
| Signal Trend | 3 | Always (if data exists) | 5+ check-ins |
| Best Tool | 4 | Active signal selected | 3+ sessions with signal data |
| Streak | 5 | Current streak ≥3 or recently broken ≥3 | Streak data |
| Time Pattern | 6 | Always (if data exists) | 10+ sessions with timestamps |

---

## Exercise Mode Classifications (V6)

| Exercise | Mode | Rationale |
|----------|------|-----------|
| Emergency Calm | relief | Acute stress only |
| 3-Minute Reset | both | Daily training + acute use |
| Slow Down | both | Breath control skill + acute |
| Body Tension Reset | training | Teaches body awareness |
| Stop the Spiral | relief | For acute anxiety |
| Unhook from Thoughts | training | Cognitive defusion skill |
| Let Thoughts Pass | training | Mindfulness skill building |
| Quick Unload | relief | Reactive stress dump |
| Look Around | both | Nervous system reset + awareness |
| Tension and Ease | training | Nervous system flexibility |
| Shake It Off | both | Body regulation + tension release |
| Box Breathing | both | Breath control + acute calming |
| Body Scan | training | Body awareness skill |
| Cold Reset | training | Stress tolerance building |

---

## Known Considerations

- `getCheckIns()` in storage.js still returns V3-shaped data (with `level`). Use `getCheckInHistory()` for V4+ data with `primarySignal`.
- Light theme border (#d1cdc6 on #ffffff) is low contrast (~1.7:1) — card separation relies on visual hierarchy, not border visibility.
- The terra cotta danger color (#c2685e) and tan warning (#c4a57a) can appear similar under low-light conditions.
- Service worker requires cache bump when files change (currently `steady-v6`).
