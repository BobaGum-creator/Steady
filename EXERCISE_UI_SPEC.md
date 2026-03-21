# Steady v2.5 — Exercise Player UI/UX Specification

> This document defines exactly how the active exercise screen behaves across all exercises.
> It is the single source of truth for the breathing animation, text hierarchy, voice system,
> and how each element adapts based on user settings. Follow this spec — do not add elements
> or layers beyond what is defined here.

---

## Design Principles

1. **Sensory over cognitive.** The user should *feel* the exercise, not *read* it. Every design decision should reduce the amount of active thinking required during a breath.
2. **Three channels maximum.** At any given moment, the user receives guidance through no more than three simultaneous channels. More than three becomes noise.
3. **The circle is the anchor.** The breathing circle with its countdown number is always the primary focal point. Nothing competes with it.
4. **Voice is the intended experience.** The app is designed voice-on. Sound-off mode is a supported fallback, not the default.

---

## Screen Layout (Top to Bottom)

```
┌─────────────────────────────────┐
│  [X]     Exercise Title    0:00 │  ← Header: close button, title, elapsed time
│     In 4s → Out 6s → In 4s...  │  ← Pattern banner (subtle, scrolling)
│                                 │
│                                 │
│         ┌───────────┐           │
│         │           │           │
│         │     6     │           │  ← Breathing circle + countdown number
│         │           │           │
│         └───────────┘           │
│                                 │
│       Slow exhale.              │  ← Instruction text (current step)
│                                 │
│       NEXT: BREATHE IN          │  ← Next step preview (conditional)
│                                 │
│                                 │
│          ● ● ○ ○                │  ← Step progress dots
│   ████░░░░░░░░░░░░░░░░░░░░░░░  │  ← Progress bar
│          Step 2 of 4            │  ← Step counter
│                                 │
│   [↻]   [▶]   [▶|]   [🔊]     │  ← Controls: restart, play/pause, skip, voice
└─────────────────────────────────┘
```

---

## Element Definitions

### 1. Breathing Circle (PRIMARY — always visible)

The large animated circle is the single most important element on screen.

**Animation behavior:**
- **Inhale:** Circle expands from small to large over the full step duration
- **Exhale:** Circle contracts from large to small over the full step duration
- **Hold / Pressure Hold:** Circle remains static at its current size (expanded if after inhale, contracted if after exhale)
- **Prompt / Cognitive / Disruption:** Circle remains neutral (default resting size), no animation

**Countdown number (inside circle):**
- Displays the remaining seconds for the current step, counting down to 0
- Large, bold, high-contrast text — the most visually prominent text on screen
- Always visible during timed steps
- Hidden (or blank) during untimed steps

**Animation timing is dynamic:** The CSS animation duration always matches the actual step duration from the exercise data (e.g., a 6-second exhale produces a 6-second shrink animation). This is set via the `--breath-duration` CSS custom property. There is never a mismatch between the countdown number and the animation speed.

---

### 2. Instruction Text (SECONDARY — always visible)

Positioned below the breathing circle. Displays the current step's instruction.

**Content rules:**
- During breathing steps (`breathe-in`, `breathe-out`, `hold`, `pressure-hold`): Short, direct cue. Examples: "Breathe in", "Slow exhale", "Hold"
- During prompt steps: Coaching text. Can be 1-2 sentences. Examples: "Breathe normally. Notice: you're fine."
- During cognitive steps: The cognitive task. Example: "Count backward from 100 by 7s"
- During disruption steps: The disruption instruction

**Styling:**
- Lighter font weight than the countdown number
- Readable but not attention-competing with the circle
- Centered, max 2 lines preferred (3 lines acceptable for coaching text)

**This text is the fallback primary cue when voice is off.** When voice is on, it serves as a visual subtitle reinforcing what the voice just said.

---

### 3. Next Step Preview (CONDITIONAL — visibility depends on voice setting)

Small, muted text below the instruction text. Shows what the next step will be.

**Display rules:**

| Voice Setting | Next Preview Visible? | Reason |
|---|---|---|
| Voice OFF | Yes | Only way user knows what's coming next |
| Voice ON | No | Voice handles transitions; extra text is clutter |

**Timing:** Appears during the final 2-3 seconds of the current step (not the entire step).

**Content format:** `NEXT: BREATHE IN` / `NEXT: HOLD` / `NEXT: EXHALE` — always uppercase, always terse. Never the full coaching instruction, just the action type.

**Styling:** Small caps, muted color (`--text-muted`), clearly subordinate to the instruction text above it.

**On the final step of the exercise:** Do not show any "NEXT" preview. The step simply ends and transitions to the post-check/debrief phase.

---

### 4. Voice Instructor (CONDITIONAL — when voice is enabled)

An audio layer that speaks step instructions aloud at each step transition.

**Voice characteristics (target):**
- Calm, composed, direct — like a coach, not a meditation guru
- Masculine tone to match target audience
- Short phrases only: "Breathe in." "Let it go." "Hold." "Stay steady."
- No filler, no over-explanation during active breathing

**What voice says per step type:**

| Step Type | Voice Cue | Notes |
|---|---|---|
| `breathe-in` | "Breathe in" | Said once at step start |
| `breathe-out` | "Slow exhale" or "Let it go" | Said once at step start |
| `hold` | "Hold" | Said once at step start |
| `pressure-hold` | "Hold" | Same as hold — keep it simple |
| `prompt` | Reads the full instruction text | Coaching moments between breaths |
| `cognitive` | Reads the cognitive task | "Count backward from 100 by 7s" |
| `disruption` | Reads the disruption | These are meant to break focus |

**Voice does NOT:**
- Announce the countdown number (that's visual only)
- Say "next" previews (the transition itself is the cue)
- Speak during the middle of a timed breath (only at step start)
- Overlap with the previous voice clip

---

## Player Controls

The bottom control bar contains four evenly-spaced circular icon buttons:

```
[↻ Restart]    [▶ Play/Pause]    [▶| Skip]    [🔊 Voice]
```

| Button | Icon (ON state) | Icon (OFF state) | Behavior |
|---|---|---|---|
| Restart | Circular arrow | — | Restarts exercise from step 1, resets all timers |
| Play/Pause | Play triangle / Pause bars | — | Toggles exercise pause state |
| Skip | Next-track arrow | — | Advances to next step immediately |
| Voice | Speaker with sound waves | Speaker with slash | Toggles voice instructor on/off mid-exercise |

### Voice Toggle Button — Detailed Behavior

**Placement:** Rightmost position in the control bar. Same size and style as the other three control buttons.

**Icons:** Speaker icon with sound waves (voice on) / Speaker icon with diagonal slash (voice off). Uses the same icon style, stroke weight, and color as the existing control icons for visual consistency.

**Tap behavior:**
- Toggles voice on/off immediately, mid-exercise
- When toggled OFF mid-step: voice stops, "NEXT" preview text begins appearing on subsequent steps
- When toggled ON mid-step: voice begins speaking at the *next* step transition (does not interrupt current silence mid-step)
- Single tap only — no long-press, no hold, no secondary action

**Persistence:** The toggle syncs to the app's global voice preference in settings (`localStorage`). Changing it in the player updates the setting globally, and vice versa. The user sets it once and it sticks across sessions.

**Default state:** Voice ON. The app ships with voice enabled as the intended experience.

---

## Composite Behavior: Voice ON vs. Voice OFF

### Voice ON (intended experience)

The user's three channels are: **voice + circle animation + countdown number**

```
What user experiences during an exhale:
- HEARS: "Slow exhale" (once, at start of step)
- SEES: Circle shrinking smoothly over 6 seconds
- SEES: Number counting 6... 5... 4... 3... 2... 1...
- SEES: Instruction text "Slow exhale" below circle (subtitle, glanceable)
- DOES NOT SEE: "NEXT: BREATHE IN" text (voice handles this)
```

This is the cleanest experience. Three aligned signals, minimal reading. The user can close their eyes after hearing the voice cue and feeling the rhythm, opening them only to glance at the countdown if desired.

### Voice OFF (fallback experience)

The user's three channels are: **instruction text + circle animation + countdown number**

```
What user experiences during an exhale:
- SEES: Circle shrinking smoothly over 6 seconds
- SEES: Number counting 6... 5... 4... 3... 2... 1...
- READS: "Slow exhale" below circle (now the primary cue)
- READS: "NEXT: BREATHE IN" appears in final 2-3 seconds (awareness of what's coming)
```

This adds a fourth visual element (the NEXT preview), but it's staggered — it only appears at the end of the step, not the whole time. So the user is never processing all four simultaneously.

---

## What This Spec Intentionally Excludes

These elements were considered and deliberately rejected to prevent scope creep:

- **Directional icons (nose, arrows):** The circle animation already communicates inhale/exhale visually. Adding icons would create a fourth simultaneous channel with no added clarity.
- **Haptic feedback:** Potentially valuable but out of scope for v2.5. Could revisit for v3.
- **Step-type color changes on the circle:** Adds visual complexity without clear benefit. The circle color stays consistent.
- **Breathing pattern text inside the circle:** The countdown number owns the circle interior. Nothing else goes there.
- **Per-step background color shifts:** Subtle ambient cues were considered but risk feeling gimmicky. The dark, calm background stays constant.

---

## Settings Integration

The voice setting is accessible from **two places** — both always in sync:

1. **In-player toggle:** The voice button in the bottom control bar (rightmost). Allows instant toggling mid-exercise without leaving the player.
2. **App settings page:** A voice on/off toggle in the global settings. For users who want to set it before starting any exercise.

Both write to the same stored preference. Changing one updates the other.

**How the voice setting affects the UI:**

| Setting State | Instruction Text | Next Preview | Voice Audio | Voice Button Icon |
|---|---|---|---|---|
| Voice ON | Visible (subtitle role) | Hidden | Active | Speaker with waves |
| Voice OFF | Visible (primary role) | Visible (final 2-3 sec) | Silent | Speaker with slash |

The breathing circle animation and countdown number are **always visible regardless of voice setting.** They are not conditional.

---

## Exercise-Specific Notes

**Breathing exercises (basic breathwork):** Standard inhale/exhale/hold cycle. All elements behave as described above.

**Pressure holds:** During `pressure-hold` steps, the circle is static (no animation). The countdown is critical here — users need to see how many seconds remain to build confidence they can endure. Voice says "Hold" once at the start and stays silent during the hold.

**Cognitive tasks:** The instruction text area displays the cognitive challenge. Voice reads it aloud once. The breathing circle goes to neutral/resting position since there's no breath action during cognitive steps.

**Disruptions:** These are intentionally jarring. The disruption text appears in the instruction area. Voice reads it. The user's job is to recover and return to breathing. The circle may behave differently here (implementation-specific).

**Repeat steps:** These are invisible to the user. The player loops back to a previous breathing pattern seamlessly. No UI change — the user just sees the next breath step as if the sequence continued naturally.

---

## Audio Architecture

The voice system uses a **reusable clip library**, not one long MP3 per exercise.

### Two-Tier Clip System

**Tier 1 — Universal Cues (by step type):** ~5 short clips reused across all exercises. "Breathe in," "Slow exhale," "Hold." One clip per step type. These are the fallback when no specific coaching clip exists.

**Tier 2 — Coaching Clips (by instruction text):** Longer, unique clips mapped to exact instruction strings. "Notice the urge to breathe," "Count backward from 100 by 7s." These override the universal cue when present.

### Lookup Priority

1. Exact instruction string match in coaching map → play that clip
2. Step type match in universal cues → play generic cue
3. No match → silent (no crash, no error)

### File Structure

```
/audio/voices/
  john/                    ← Male voice (default)
    cues/                  ← Tier 1 universal clips
      breathe-in.mp3
      breathe-out.mp3
      hold.mp3
    coaching/              ← Tier 2 specific clips
      double-inhale-nose.mp3
      hold-stay-relaxed-notice-urge.mp3
      ...
  jane/                    ← Female voice (alternate)
    cues/
    coaching/
```

### Adding a New Clip

1. Record the MP3 and drop it in the correct folder
2. Add one line to the mapping in `voice-config.js`
3. Done — the player picks it up automatically

### Pause / Skip / Restart Resilience

Each clip is self-contained (1-8 seconds). No long audio tracks to seek through:
- **Pause:** Audio pauses mid-clip, resumes on unpause
- **Skip:** Current clip stops, next step's clip plays
- **Restart:** Current clip stops, step 1's clip plays
- **Missing file:** Silent fallback, no error

### Voice Selection

Two voices available: `john` (male, default) and `jane` (female). Switching voices clears the clip cache and reloads from the new voice's folder. The voice preference is stored in settings alongside the enabled/disabled state.

---

*Last updated: March 2026 — Steady v2.5*
*This spec governs all exercise player UI decisions. Changes require deliberate revision of this document.*
