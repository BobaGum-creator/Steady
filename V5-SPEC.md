# Steady V5 — Insights & Patterns

## The Story So Far

V1 built the engine (14 exercises, player, timer). V2 added polish (themes, favorites, audio, charts, sharing). V3 added personalization (onboarding, outcome-based recommendations, narration, haptics). V4 replaced the vague 1-10 stress slider with 4 concrete nervous system signals — mind speed, body tension, breathing ease, internal pressure.

V4 created the signal data structure. V5 makes that data talk back to you.

## The Problem

Right now, the Progress tab shows a weekly bar chart (session count), a session list ("Box Breathing — Tuesday"), and a "Most Helpful" ranking. That's fine for week 1. But after a few weeks of use, the user has rich signal-level before/after data and the app does nothing interesting with it. There's no answer to questions like:

- "Is this actually working over time?"
- "What's my most common signal pattern?"
- "Do I tend to feel worse on certain days?"
- "Which exercise is best for *my* racing mind specifically?"
- "Am I getting better at managing tension, or is it getting worse?"

The home screen also resets every day — there's no sense of continuity between sessions, no "yesterday you were dealing with body tension, how's that today?"

## V5 Principles

1. **Insights must earn their screen space.** Don't show a chart because we can — show it because it changes what the user does next.
2. **No dashboards.** Nobody opens a stress app to look at dashboards. Insights should be bite-sized cards that appear when they're relevant and disappear when they're not.
3. **Minimum data threshold.** Every insight has a minimum number of sessions before it shows. No "your most common signal is mind" after 1 check-in.
4. **Celebrate quietly.** Show improvement without being a cheerleader. "Your body tension has been lower this week" is better than "🎉 Amazing progress! Keep it up! 🏆"

---

## Feature 1: Insight Cards (Home Screen)

### What

A stack of contextual insight cards that appear on the home screen below the signal grid (and above the quick actions). Each card shows one actionable observation from the user's data. Only cards with enough data are shown. Maximum 2 cards visible at a time.

### Insight Card Types

**1. Signal Trend Card**
- Trigger: 5+ check-ins in the last 14 days
- Shows: The user's most frequently selected signal this week vs last week
- Example: "Racing mind has been your top signal 4 of the last 5 days"
- Example: "Body tension dropped from your #1 signal last week to #3 this week"
- Action: Tapping the card selects that signal and scrolls to recommendations

**2. Best Tool Card**
- Trigger: 3+ completed sessions with signal data for a given signal
- Shows: Which exercise produced the biggest signal reduction for the user's currently selected (or most frequent) signal
- Example: "Box Breathing dropped your mind speed by an average of 1.7 levels"
- Example: "For body tension, PMR works best for you (Locked → Loose in 3 of 4 sessions)"
- Action: Tapping starts that exercise

**3. Streak & Consistency Card**
- Trigger: Current streak >= 3 days, OR the user just broke a streak
- Shows: Current streak context, not just the number
- Example: "5 days consistent — your longest streak yet"
- Example: "You missed yesterday, but you've done 8 sessions this week — that's great"
- NOT: "🔥 5 day streak!" (too gamified for a stress app)

**4. Time Pattern Card**
- Trigger: 10+ sessions with timestamps
- Shows: When the user tends to practice and whether that correlates with better results
- Example: "You tend to practice in the evening — your sessions have 40% better relief then"
- Example: "Morning sessions work better for your racing mind"
- Action: Could adjust recommendation timing

**5. Continuity Card**
- Trigger: User checked in yesterday with a signal
- Shows: A gentle bridge from yesterday's state
- Example: "Yesterday was about shallow breathing. How are you feeling today?"
- Disappears: After today's check-in

### Data Requirements

Each insight card needs a `shouldShow(sessions, checkIns)` function and a `render()` function. The `shouldShow` function checks data thresholds; `render` builds the HTML.

### Implementation

New file: `js/insights.js`

```javascript
// Insight engine — each insight is an object with:
// {
//   id: string,
//   priority: number,           // lower = higher priority
//   shouldShow: (data) => bool, // data threshold check
//   render: (data) => string,   // returns HTML string
//   action: (data) => void,     // what happens on tap
// }

export function getInsights(data) {
  // data = { checkIns, sessions, signalEff, profile }
  // Returns top 2 insights that pass their shouldShow() check,
  // sorted by priority
}
```

### storage.js additions

```javascript
// NEW: getCheckInHistory(days) — returns all check-ins as array
// with { date, primarySignal, timestamp }
// Needed for signal trend analysis

// NEW: getDismissedInsights() / dismissInsight(id)
// User can swipe away an insight card; don't show it again for 7 days
```

### app.js additions

- `initHome()` calls `renderInsightCards()` after `setupSignalGrid()`
- Insight cards render into a new `#insight-cards` container in home view HTML
- Each card is tappable with a small "×" dismiss button

### CSS

- `.insight-card` — subtle background (lighter than cards, or left-border accent), rounded, compact (max 3 lines of text)
- `.insight-card .insight-text` — the main observation
- `.insight-card .insight-action` — small CTA link ("Try it" / "See more")
- Swipe-to-dismiss animation (CSS transform + opacity)

---

## Feature 2: Signal History Chart (Progress Tab)

### What

Replace (or augment) the weekly session-count bar chart with a signal-level history visualization that shows how each signal has trended over time.

### Design

A horizontal timeline showing the last 14 days. For each day that has session data, show small colored dots representing signal levels:

```
Signal Trends (Last 2 Weeks)
─────────────────────────────────────

        M   T   W   T   F   S   S   M   T   W   T   F   S   S
Mind    ·   ●   ●   ·   ○   ·   ·   ●   ○   ○   ·   ○   ·   ·
Body    ·   ○   ●   ·   ○   ·   ·   ○   ○   ·   ·   ·   ·   ·
Breath  ·   ○   ○   ·   ·   ·   ·   ○   ·   ·   ·   ·   ·   ·
Pressure·   ●   ○   ·   ·   ·   ·   ○   ·   ○   ·   ·   ·   ·

● = high (2)   ○ = moderate (1)   · = low/calm (0) or no data
```

On mobile, this renders as a compact grid using CSS grid. Each cell is a small circle (8px) colored by level:
- Level 0 (calm): very faint dot or no dot
- Level 1 (moderate): medium-opacity accent color
- Level 2 (high): full-opacity warning/danger color

### Data Source

Uses `signalsBefore` from session data (the pre-exercise reading is the most accurate snapshot of how the user *actually felt* that day, before the exercise changed anything).

If multiple sessions exist on one day, use the highest signal level for that day (worst-case snapshot).

### Implementation

- New function in app.js: `renderSignalChart()`
- Reads from `storage.getRecentSessions(14)`
- Builds a day-by-signal grid
- Renders into a new `#signal-chart` container in the history view
- Placed above the existing weekly bar chart

### CSS

- `.signal-chart` — container with horizontal scroll on very narrow screens
- `.signal-chart-grid` — CSS grid, 15 columns (1 label + 14 days)
- `.signal-dot` — 8px circle, border-radius 50%
- `.signal-dot.level-0` — `opacity: 0.15`
- `.signal-dot.level-1` — accent color, `opacity: 0.6`
- `.signal-dot.level-2` — warning color, `opacity: 1.0`

---

## Feature 3: Exercise Report Card (Post-Exercise Enhancement)

### What

After saving a session, before navigating home, show a brief "report card" for 2 seconds that contextualizes this session in the user's history with that exercise.

### Design

Appears as an overlay or replaces the post-exercise screen briefly:

```
───────────────────────
  Box Breathing

  Mind Speed: Racing → Calm
  Body Tension: Tight → Loose

  This is your 5th time doing this exercise.
  It's been your best tool for racing mind.
───────────────────────
```

### Rules

- Only shows if the user has 2+ previous sessions with this exercise
- Only shows for 3 seconds, then auto-navigates home (with a "Done" button to skip)
- Shows at most 2 lines of context (session count + best signal insight)
- If this is the user's first or second time, skip the report card entirely

### Data

Uses `getSignalEffectiveness()` and `getRecentSessions()` filtered to this exercise.

### Implementation

- New function: `showExerciseReport(exerciseId, preSignals, postSignals)`
- Called from `saveBtn.onclick` after saving, instead of immediately navigating home
- Creates a temporary overlay div, removes it after 3 seconds or on tap
- Falls back to immediate navigation if data threshold not met

---

## Feature 4: Smart Defaults on Pre-Exercise State Check

### What

Instead of always defaulting all 4 signals to "moderate" (level 1) on the pre-exercise screen, use the user's recent data to set smarter defaults.

### Logic

1. If the user tapped a signal on the home screen (activeSignal), default that signal to level 2 (high) and others to level 1.
2. If the user has a check-in from today, look at their most recent session's `signalsAfter` — use those as starting defaults (their state *after* the last session is probably close to their current state).
3. If it's a new day with no data, default all to level 1 (current behavior).

### Why

This reduces taps. If you told the home screen "racing mind" and then start an exercise, you shouldn't have to re-select "Racing" for mind speed. The app should already know.

### Implementation

Modify `setupPreStateCheck()` in app.js:

```javascript
function setupPreStateCheck() {
  const container = $('state-check-pre');
  if (!container) return;

  // Smart defaults
  const defaults = getSmartDefaults();

  container.querySelectorAll('.signal-row').forEach(row => {
    const sig = row.dataset.signal;
    const defaultLevel = defaults[sig] || 1;
    row.querySelectorAll('.signal-level').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.level) === defaultLevel);
    });
  });

  // ... existing click handler wiring ...
}

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
```

---

## Feature 5: Weekly Summary (Notification Enhancement)

### What

Enhance the daily reminder notification with a weekly summary that fires once per week (default: Sunday evening). The summary is not a push notification — it's a card that appears on the home screen when the user opens the app on Sunday/Monday.

### Design

```
───────────────────────
  Your Week

  6 sessions · 4 days active
  Most common signal: Racing mind (4×)
  Best result: PMR dropped body tension
  from Locked to Loose on Thursday
───────────────────────
```

### Rules

- Shows on the home screen as a special insight card (highest priority)
- Only appears if the user has 3+ sessions that week
- Disappears after the user taps "Got it" or after Monday midnight
- Stored in localStorage with a `weekOf` key so it doesn't re-show

### Data

```javascript
function generateWeeklySummary() {
  const sessions = storage.getRecentSessions(7);
  if (sessions.length < 3) return null;

  // Count active days
  const activeDays = new Set(sessions.map(s => s.date)).size;

  // Most common signal from check-ins
  const checkIns = storage.getCheckIns(7);
  const signalCounts = {};
  checkIns.forEach(c => {
    if (c.primarySignal) signalCounts[c.primarySignal] = (signalCounts[c.primarySignal] || 0) + 1;
  });

  // Best single-session result
  let bestShift = null;
  sessions.forEach(s => {
    if (!s.signalsBefore || !s.signalsAfter) return;
    SIGNAL_IDS.forEach(sig => {
      const drop = s.signalsBefore[sig] - s.signalsAfter[sig];
      if (!bestShift || drop > bestShift.drop) {
        bestShift = { exerciseId: s.exerciseId, signal: sig, drop, before: s.signalsBefore[sig], after: s.signalsAfter[sig], date: s.date };
      }
    });
  });

  return { sessionCount: sessions.length, activeDays, signalCounts, bestShift };
}
```

---

## Files Changed

| File | Changes |
|---|---|
| `js/insights.js` | **NEW** — Insight engine with 5 card types, shouldShow/render/action pattern |
| `js/storage.js` | Add `getCheckInHistory(days)`, `getDismissedInsights()`, `dismissInsight(id)` |
| `js/app.js` | Import insights module; render insight cards on home; render signal chart on history; exercise report card after save; smart pre-check defaults; weekly summary card |
| `index.html` | Add `#insight-cards` container in home view; add `#signal-chart` container in history view; add insights.js to script if needed (or import from app.js) |
| `styles.css` | Add `.insight-card`, `.signal-chart`, `.signal-dot`, `.exercise-report`, `.weekly-summary` styles |
| `sw.js` | Bump cache to `steady-v5`; add `insights.js` to SHELL_ASSETS |

---

## Implementation Order

1. **storage.js** — Add `getCheckInHistory()`, `getDismissedInsights()`, `dismissInsight()` (data layer first)
2. **js/insights.js** — Build the 5 insight card types with shouldShow/render/action
3. **index.html** — Add container divs for insight cards and signal chart
4. **styles.css** — All new V5 styles
5. **app.js** — Wire insight cards into home, signal chart into history, exercise report card, smart defaults, weekly summary
6. **sw.js** — Bump cache, add insights.js
7. **Verify** — Syntax check, cross-reference, data threshold edge cases

---

## Data Thresholds Summary

| Feature | Minimum Data |
|---|---|
| Signal Trend Card | 5 check-ins in 14 days |
| Best Tool Card | 3 completed sessions with signal data for that signal |
| Streak Card | 3+ day streak or broken streak after 3+ |
| Time Pattern Card | 10 sessions with timestamps |
| Continuity Card | Yesterday's check-in exists |
| Signal History Chart | 3 sessions with signal data in 14 days |
| Exercise Report Card | 2+ previous sessions with this exercise |
| Smart Defaults | Any recent session or home screen signal tap |
| Weekly Summary | 3+ sessions in the past 7 days |

---

## What V5 Does NOT Change

- Exercise library and content — unchanged
- Player/timer/breathing circle — unchanged
- Narration layer and haptics — unchanged
- Signal grid on home screen — unchanged (insight cards appear *below* it)
- Pre/post state check UI — unchanged (just smarter defaults)
- Journal — unchanged
- Settings — unchanged
- Onboarding — unchanged
- Export/Import — unchanged (new localStorage keys are simple JSON, handled by existing export)
- Favorites — unchanged

---

## What V5 Sets Up for V6+

- The insight engine pattern (`shouldShow` / `render` / `action`) is extensible — new card types can be added without touching existing code
- Signal history data enables future features: monthly reports, PDF export of progress, "share my journey" image with signal trends
- The exercise report card pattern could evolve into a full "exercise detail page" showing all your history with that specific exercise
- Time pattern detection could feed into smarter notification timing ("remind me when I usually practice")
