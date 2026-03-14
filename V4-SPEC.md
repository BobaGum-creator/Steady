# Steady V4 — State Check System

## The Problem

The current stress tracking uses a single 1-10 slider ("How stressed do you feel?"). This has three problems:

1. **Vague** — people don't know what "stressed" means. Your wife has a tight jaw and shallow breathing but wouldn't say she's "stressed."
2. **Hard to re-rate** — after doing box breathing, you rated 8 before. Now you feel different but don't know what number to pick. The number felt arbitrary both times.
3. **Doesn't drive action** — knowing you're "a 7" doesn't tell the app *what kind* of exercise to recommend.

## The Solution: 4 Nervous System Signals

Replace the single stress number with 4 concrete, body-anchored signals:

| Signal | ID | What it captures | Example self-talk |
|---|---|---|---|
| **Mind Speed** | `mind` | Racing thoughts, mental noise, inability to focus | "My brain won't shut up" |
| **Body Tension** | `body` | Jaw clenching, tight shoulders, stomach knots | "I'm holding tension everywhere" |
| **Breathing** | `breath` | Shallow, tight chest, can't take a full breath | "I can't breathe deeply" |
| **Internal Pressure** | `pressure` | Restlessness, dread, unnamed unease, "vibrating" feeling | "Something feels off but I can't name it" |

### Why these 4

- They cover the 3 nervous system channels: cognitive (mind), somatic (body + breath), and affective (pressure).
- Each maps cleanly to exercise categories — breathwork for breath, PMR/body scan for tension, defusion/grounding for racing mind, orienting/pendulation for pressure.
- They're observable. You don't need to introspect about "stress." You just notice: is my jaw tight? Are my thoughts racing?

---

## Three Interaction Points

### 1. Home Screen — "What feels strongest right now?"

**Replaces:** The stress slider + check-in button.

**UI:** Four tappable signal cards arranged in a 2×2 grid. Each card shows:
- Icon + signal name (e.g. 🌀 Racing Mind)
- Short description (e.g. "Thoughts won't quiet down")
- Tap to select → card highlights, others dim slightly

**Behavior:**
- User taps the one signal that feels strongest right now.
- This is a **single tap** — not 4 separate ratings. Minimum friction.
- The selected signal is saved as today's check-in and immediately influences recommendations.
- If the user has already checked in today, their previous selection is shown (highlighted card). They can tap a different one to update.
- The recommendation card below updates instantly based on the selected signal.

**Data model (check-in):**
```javascript
// Replaces: { level: 7, timestamp }
{
  primarySignal: 'mind',  // which signal feels strongest
  timestamp: Date.now()
}
```

**Why single-tap, not 4 ratings:** The home screen is the front door. It needs to be fast. "What feels strongest?" is one decision, one tap. We save the granular 4-signal rating for the pre-exercise screen where the user has already committed to doing something.

---

### 2. Pre-Exercise — State Check (4 signals, 3 levels each)

**Replaces:** The 1-10 number buttons.

**UI:** A single screen titled "Quick body check" with all 4 signals listed vertically. Each signal has 3 tappable level buttons:

```
Quick body check
────────────────────────────

🌀 Mind Speed
[ Calm ]  [ Busy ]  [ Racing ]

💪 Body Tension
[ Loose ]  [ Tight ]  [ Locked ]

🌬️ Breathing
[ Deep ]  [ Shallow ]  [ Stuck ]

⚡ Internal Pressure
[ Settled ]  [ Uneasy ]  [ Intense ]

                        [ Begin → ]
```

**Behavior:**
- Each signal defaults to the middle option (Busy / Tight / Shallow / Uneasy) so the user only needs to adjust what feels different.
- Tapping a level button selects it (pill highlight). One tap per row.
- "Begin" starts the exercise. No validation needed — the defaults are reasonable.
- Total interaction: 0-4 taps + Begin. Usually 1-2 taps.

**Level encoding:**
```javascript
// 0 = low (calm/loose/deep/settled)
// 1 = moderate (busy/tight/shallow/uneasy)
// 2 = high (racing/locked/stuck/intense)
{ mind: 1, body: 2, breath: 1, pressure: 0 }
```

**Why 3 levels, not 1-10:** Three levels (low / moderate / high) are fast to assess. You immediately know if your jaw is "loose, tight, or locked." You don't need to decide between a 6 and a 7. Three levels also produce clean shift language afterward ("tight → loose" reads naturally).

---

### 3. Post-Exercise — Shift Check (only elevated signals)

**Replaces:** The 1-10 number buttons after exercise.

**UI:** Only shows signals that were rated moderate or high in the pre-check. If you said mind was "racing" and body was "locked" but breathing was "deep" and pressure was "settled," you only re-rate mind and body.

```
How do you feel now?
────────────────────────────

🌀 Mind Speed
  Was: Racing
[ Calm ]  [ Busy ]  [ Racing ]

💪 Body Tension
  Was: Locked
[ Loose ]  [ Tight ]  [ Locked ]

                     [ Save → ]
```

**Behavior:**
- Each signal defaults to one level lower than the pre-rating (nudge toward improvement, user adjusts if needed).
- If all 4 signals were low/calm pre-exercise, show a simple "Still feeling good?" with a thumbs-up confirmation instead. (No re-rating needed.)
- "Save" stores the session with full before/after signal data.

**Why only elevated signals:** Asking about signals that were already fine is noise. If your breathing was deep before the exercise, we don't need to ask about it after. This keeps the post-exercise screen to 1-3 items max, usually 1-2.

---

## Data Model Changes

### Check-in (daily, home screen)

**Storage key:** `steady_checkin_YYYY-MM-DD` (same key pattern, new shape)

```javascript
// V3 (current):
{ level: 7, timestamp: 1234567890 }

// V4 (new):
{
  primarySignal: 'mind',   // 'mind' | 'body' | 'breath' | 'pressure'
  timestamp: 1234567890
}
```

**Migration:** Old check-ins with `level` property are left as-is. New code checks for `primarySignal` property; if absent, falls back to treating old data as legacy. No destructive migration.

### Session (per exercise)

**Storage key:** `steady_session_TIMESTAMP` (same key pattern, new shape)

```javascript
// V3 (current):
{
  exerciseId: 'box-breathing',
  stressBefore: 7,
  stressAfter: 3,
  completed: true,
  duration: 185,
  timestamp: 1234567890,
  date: '2026-03-12'
}

// V4 (new):
{
  exerciseId: 'box-breathing',
  stressBefore: 7,              // KEEP for backward compat (computed: sum of signal levels)
  stressAfter: 3,               // KEEP for backward compat (computed: sum of post-signal levels)
  signalsBefore: { mind: 2, body: 2, breath: 1, pressure: 0 },
  signalsAfter:  { mind: 0, body: 1, breath: 1, pressure: 0 },
  completed: true,
  duration: 185,
  timestamp: 1234567890,
  date: '2026-03-12'
}
```

**Backward compatibility:** `stressBefore` and `stressAfter` remain as computed summary values (sum of 4 signal levels, range 0-8). This keeps `getExerciseEffectiveness()`, `getMostUsedExercises()`, streak logic, and the share image working without changes. The `signalsBefore`/`signalsAfter` objects are the new primary data.

**Computed summary:** `stressBefore = signalsBefore.mind + signalsBefore.body + signalsBefore.breath + signalsBefore.pressure` (range 0-8).

### storage.js function changes

```javascript
// MODIFY: saveCheckIn — accept signal instead of level
export function saveCheckIn(primarySignal) {
  // Validate: must be 'mind' | 'body' | 'breath' | 'pressure'
  const checkIn = { primarySignal, timestamp: Date.now() };
  localStorage.setItem(`${PREFIX}checkin_${getToday()}`, JSON.stringify(checkIn));
  idbPut('checkins', getToday(), checkIn);
}

// MODIFY: getTodayCheckIn — returns new shape (or legacy shape)
// No change needed to the function itself, callers handle both shapes

// MODIFY: saveSession — accept signals objects
export function saveSession(exerciseId, data) {
  // data.signalsBefore: { mind, body, breath, pressure }
  // data.signalsAfter:  { mind, body, breath, pressure }
  // Compute stressBefore/stressAfter for backward compat
  const sumSignals = (s) => (s.mind || 0) + (s.body || 0) + (s.breath || 0) + (s.pressure || 0);
  const session = {
    exerciseId,
    stressBefore: sumSignals(data.signalsBefore),
    stressAfter: sumSignals(data.signalsAfter),
    signalsBefore: data.signalsBefore,
    signalsAfter: data.signalsAfter,
    completed: data.completed === true,
    duration: data.duration,
    timestamp: Date.now(),
    date: getToday(),
  };
  // ... persist as before
}

// NEW: getSignalEffectiveness(days = 90)
// Returns per-exercise, per-signal reduction data
// Map<exerciseId, { mind: avgReduction, body: avgReduction, breath: avgReduction, pressure: avgReduction, count }>
export function getSignalEffectiveness(days = 90) {
  const sessions = getRecentSessions(days);
  const map = new Map();
  sessions.forEach(s => {
    if (!s.signalsBefore || !s.signalsAfter || !s.completed) return;
    if (!map.has(s.exerciseId)) {
      map.set(s.exerciseId, { count: 0, mind: 0, body: 0, breath: 0, pressure: 0 });
    }
    const entry = map.get(s.exerciseId);
    entry.count++;
    ['mind', 'body', 'breath', 'pressure'].forEach(sig => {
      entry[sig] += (s.signalsBefore[sig] || 0) - (s.signalsAfter[sig] || 0);
    });
  });
  // Compute averages
  const result = new Map();
  map.forEach((entry, id) => {
    result.set(id, {
      count: entry.count,
      mind: entry.mind / entry.count,
      body: entry.body / entry.count,
      breath: entry.breath / entry.count,
      pressure: entry.pressure / entry.count,
    });
  });
  return result;
}
```

---

## Exercise-to-Signal Mapping (data.js)

Add a `signals` array to each exercise definition. This tells the recommendation engine which signals this exercise is most likely to improve.

```javascript
// Examples:
{
  id: 'physiological-sigh',
  // ... existing fields ...
  signals: ['breath', 'pressure'],  // NEW: primary signals this exercise targets
}

{
  id: 'box-breathing',
  signals: ['breath', 'mind'],
}

{
  id: 'pmr-short',
  signals: ['body'],
}

{
  id: 'grounding-54321',
  signals: ['mind', 'pressure'],
}

{
  id: 'name-the-story',
  signals: ['mind'],
}
```

### Full mapping:

| Exercise | Primary Signals |
|---|---|
| Emergency Calm (physiological-sigh) | `breath`, `pressure` |
| 3-Minute Reset (resonant-breathing) | `breath`, `body` |
| Slow Down (extended-exhale) | `breath`, `pressure` |
| Body Tension Reset (pmr-short) | `body` |
| Box Breathing (box-breathing) | `breath`, `mind` |
| Stop the Spiral (grounding-54321) | `mind`, `pressure` |
| Unhook from Thoughts (name-the-story) | `mind` |
| Let Thoughts Pass (leaves-on-stream) | `mind`, `pressure` |
| Quick Unload (stress-journal) | `mind`, `pressure` |
| Look Around (orienting-response) | `pressure`, `body` |
| Tension and Ease (pendulation) | `body`, `pressure` |
| Shake It Off (tremor-release) | `body`, `pressure` |
| Body Scan (body-scan) | `body`, `breath` |
| Cold Reset (cold-exposure-breathing) | `breath`, `pressure` |

---

## Recommendation Engine Changes (app.js)

### Home screen (signal-driven)

When the user taps a signal card on the home screen, `getRecommendation()` receives the selected signal and heavily weights exercises that target it:

```javascript
function getRecommendation(activeSignal = null) {
  // ... existing scoring logic stays ...

  // NEW: Signal-based scoring (highest priority)
  if (activeSignal) {
    // Exercise targets this signal → big boost
    if (ex.signals && ex.signals.includes(activeSignal)) {
      score += 8;
      reason = SIGNAL_LABELS[activeSignal].recommendation;
      // e.g. "Good for racing thoughts" / "Targets body tension"
    }

    // Personal signal effectiveness data (V4 learning)
    const sigEff = signalEffectiveness.get(ex.id);
    if (sigEff && sigEff.count >= 2 && sigEff[activeSignal] > 0.5) {
      score += 5;
      reason = `Your best tool for ${SIGNAL_LABELS[activeSignal].name.toLowerCase()}`;
    }
  }
}
```

### Pre-exercise signal-driven recommendations (future)

Once we have enough signal-specific effectiveness data (V4.1+), we can show "Based on your state check, we suggest..." before the user even picks an exercise. But for V4.0, we keep it to the home screen recommendation card.

---

## UI/CSS Changes

### Home View — Signal Cards (replaces slider)

Remove:
- `#stress-slider` (range input)
- `#stress-value` (number display)
- `#checkin-save` (save button)
- `.checkin-section` container

Add:
```html
<div class="signal-grid" id="signal-grid">
  <button class="signal-card" data-signal="mind">
    <span class="signal-icon">🌀</span>
    <span class="signal-name">Racing Mind</span>
    <span class="signal-hint">Thoughts won't quiet down</span>
  </button>
  <button class="signal-card" data-signal="body">
    <span class="signal-icon">💪</span>
    <span class="signal-name">Tight Body</span>
    <span class="signal-hint">Tension in muscles or jaw</span>
  </button>
  <button class="signal-card" data-signal="breath">
    <span class="signal-icon">🌬️</span>
    <span class="signal-name">Shallow Breathing</span>
    <span class="signal-hint">Can't take a full breath</span>
  </button>
  <button class="signal-card" data-signal="pressure">
    <span class="signal-icon">⚡</span>
    <span class="signal-name">Internal Pressure</span>
    <span class="signal-hint">Restless or uneasy feeling</span>
  </button>
</div>
```

CSS: 2×2 grid, rounded cards with subtle border, selected state has accent glow + slight scale. Cards are ~120px tall, full-width on mobile (2 columns). Tap animation with haptic feedback.

### Player Pre-Screen — State Check (replaces 1-10 buttons)

Remove:
- `#pre-stress-select` (1-10 buttons)
- The "How stressed are you?" heading

Add:
```html
<div class="state-check" id="state-check-pre">
  <h3 class="state-check-title">Quick body check</h3>

  <div class="signal-row" data-signal="mind">
    <div class="signal-row-label">🌀 Mind Speed</div>
    <div class="signal-levels">
      <button class="signal-level" data-level="0">Calm</button>
      <button class="signal-level selected" data-level="1">Busy</button>
      <button class="signal-level" data-level="2">Racing</button>
    </div>
  </div>

  <div class="signal-row" data-signal="body">
    <div class="signal-row-label">💪 Body Tension</div>
    <div class="signal-levels">
      <button class="signal-level" data-level="0">Loose</button>
      <button class="signal-level selected" data-level="1">Tight</button>
      <button class="signal-level" data-level="2">Locked</button>
    </div>
  </div>

  <div class="signal-row" data-signal="breath">
    <div class="signal-row-label">🌬️ Breathing</div>
    <div class="signal-levels">
      <button class="signal-level" data-level="0">Deep</button>
      <button class="signal-level selected" data-level="1">Shallow</button>
      <button class="signal-level" data-level="2">Stuck</button>
    </div>
  </div>

  <div class="signal-row" data-signal="pressure">
    <div class="signal-row-label">⚡ Internal Pressure</div>
    <div class="signal-levels">
      <button class="signal-level" data-level="0">Settled</button>
      <button class="signal-level selected" data-level="1">Uneasy</button>
      <button class="signal-level" data-level="2">Intense</button>
    </div>
  </div>
</div>
```

CSS: Each signal row is a horizontal flex with label left and 3 pill buttons right. Selected pill has filled accent background. Compact vertical spacing — all 4 rows + Begin button visible without scrolling on a 667px screen (iPhone SE).

### Player Post-Screen — Shift Display (replaces 1-10 buttons)

Dynamic HTML generated by JS — only shows elevated signals:

```html
<div class="state-check" id="state-check-post">
  <h3 class="state-check-title">How do you feel now?</h3>

  <!-- Only signals that were >= 1 before -->
  <div class="signal-row" data-signal="mind">
    <div class="signal-row-label">🌀 Mind Speed</div>
    <div class="signal-was">Was: Racing</div>
    <div class="signal-levels">
      <button class="signal-level" data-level="0">Calm</button>
      <button class="signal-level selected" data-level="1">Busy</button>
      <button class="signal-level" data-level="2">Racing</button>
    </div>
  </div>

  <!-- ... other elevated signals ... -->
</div>
```

### Shift Result (after save)

When the session is saved, show a brief shift summary toast or inline message:

```
"Mind speed: Racing → Calm  •  Body tension: Locked → Tight"
```

This replaces the old "7 → 3" display in history items too.

---

## History/Insights Changes

### History item display

```javascript
// V3: "7 → 3"
// V4: Show signal shifts inline
// If signalsBefore/signalsAfter exist, show the most-improved signal:
// "Mind: Racing → Calm" or "Body: Locked → Loose"
// If only old stressBefore/stressAfter, show legacy "7 → 3"
```

### Most Helpful (new: per-signal breakdown)

The "Most Helpful" section can now show *why* an exercise is helpful:

```
🌬️ Box Breathing
  3x • Best for racing mind (avg 1.7 level drop)
```

This uses `getSignalEffectiveness()` data.

### Weekly chart

Keep the session count bar chart as-is. It's simple and useful. The signal data enriches the individual session details, not the weekly overview.

---

## Signal Label Constants

Define once, use everywhere:

```javascript
const SIGNALS = {
  mind: {
    id: 'mind',
    name: 'Mind Speed',
    icon: '🌀',
    cardLabel: 'Racing Mind',
    cardHint: "Thoughts won't quiet down",
    levels: ['Calm', 'Busy', 'Racing'],
    recommendation: 'Good for racing thoughts',
  },
  body: {
    id: 'body',
    name: 'Body Tension',
    icon: '💪',
    cardLabel: 'Tight Body',
    cardHint: 'Tension in muscles or jaw',
    levels: ['Loose', 'Tight', 'Locked'],
    recommendation: 'Targets body tension',
  },
  breath: {
    id: 'breath',
    name: 'Breathing',
    icon: '🌬️',
    cardLabel: 'Shallow Breathing',
    cardHint: "Can't take a full breath",
    levels: ['Deep', 'Shallow', 'Stuck'],
    recommendation: 'Opens up your breathing',
  },
  pressure: {
    id: 'pressure',
    name: 'Internal Pressure',
    icon: '⚡',
    cardLabel: 'Internal Pressure',
    cardHint: 'Restless or uneasy feeling',
    levels: ['Settled', 'Uneasy', 'Intense'],
    recommendation: 'Eases internal pressure',
  },
};
```

---

## Migration & Backward Compatibility

1. **Old check-ins** (V1-V3): Have `level` property. New code checks `if (checkIn.primarySignal)` — if absent, treats as legacy. Legacy check-ins display as "Stress: 7/10" in history. No data deleted.

2. **Old sessions** (V1-V3): Have `stressBefore`/`stressAfter` as numbers, no `signalsBefore`/`signalsAfter`. All existing functions that read `stressBefore`/`stressAfter` continue working because V4 sessions still include these computed fields. The `getExerciseEffectiveness()` function works unchanged. The new `getSignalEffectiveness()` function simply skips sessions without signal data.

3. **Onboarding profile**: No changes. The stressor types from onboarding still influence recommendations alongside the new signal data.

4. **Export/Import**: No changes needed. The JSON export captures whatever shape is in localStorage. Importing old data works because the code handles both shapes.

---

## Files Changed

| File | Changes |
|---|---|
| `js/data.js` | Add `signals: [...]` array to each exercise |
| `js/storage.js` | Modify `saveCheckIn()`, `saveSession()` signatures; add `getSignalEffectiveness()`; keep backward compat fields |
| `js/app.js` | Replace slider with signal grid on home; replace 1-10 buttons with state-check in player pre/post; update `getRecommendation()` for signal-based scoring; update history display; add `SIGNALS` constants |
| `index.html` | Replace checkin slider HTML with signal grid; replace pre/post stress buttons with state-check containers |
| `styles.css` | Add `.signal-grid`, `.signal-card`, `.state-check`, `.signal-row`, `.signal-levels`, `.signal-level`, `.signal-was` styles; remove old `.stress-slider`, `.stress-quick-select` styles |
| `sw.js` | Bump cache to `steady-v4` |
| `README.md` | Add V4 changelog |

---

## Implementation Order

1. **data.js** — Add `signals` array to all 14 exercises (small, no dependencies)
2. **storage.js** — Modify `saveCheckIn()`, `saveSession()`, add `getSignalEffectiveness()` (data layer first)
3. **index.html** — Replace slider HTML and pre/post button HTML with new signal UI containers
4. **styles.css** — Add all new signal-related styles
5. **app.js** — Wire everything up: signal grid logic, state-check pre/post logic, recommendation engine update, history display update, SIGNALS constants
6. **sw.js** — Bump cache version
7. **Verify** — Syntax check all files, cross-reference check, test in browser

---

## What V4 Does NOT Change

- Player/timer/breathing circle — unchanged
- Narration layer — unchanged
- Haptic feedback — unchanged
- Audio cues — unchanged
- Journal — unchanged
- Favorites — unchanged
- Settings — unchanged
- Onboarding flow — unchanged (still useful for initial profile)
- Export/Import — unchanged (handles both data shapes)
- PWA/Service Worker behavior — unchanged (just cache version bump)
- Share progress image — still uses `stressBefore`/`stressAfter` summary numbers, works as before
