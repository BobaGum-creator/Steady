/**
 * Steady - Voice Configuration
 * Maps step types and instruction strings to audio clip filenames.
 *
 * Architecture:
 * - Tier 1 (Universal cues): Short clips mapped by step TYPE. Reused across all exercises.
 * - Tier 2 (Coaching clips): Longer clips mapped by exact INSTRUCTION string. Exercise-specific.
 *
 * Lookup priority:
 * 1. Exact instruction match in coaching map → play that specific clip
 * 2. Step type match in universal cues map → play the generic cue
 * 3. No match → silent (no crash, no error)
 *
 * File structure:
 *   /audio/voices/{voiceId}/cues/{filename}.mp3      ← Tier 1
 *   /audio/voices/{voiceId}/coaching/{filename}.mp3   ← Tier 2
 *
 * Adding a new clip:
 *   1. Record the MP3 and drop it in the correct folder
 *   2. Add one line to the appropriate map below
 *   3. Done — the player picks it up automatically
 *
 * @module voice-config
 */

// ============================================================================
// AVAILABLE VOICES
// ============================================================================

export const voices = {
  john: {
    id: 'john',
    label: 'John',
    description: 'Calm, composed male voice',
    basePath: 'audio/voices/john',
  },
  jane: {
    id: 'jane',
    label: 'Jane',
    description: 'Calm, composed female voice',
    basePath: 'audio/voices/jane',
  },
};

export const DEFAULT_VOICE = 'john';

// ============================================================================
// TIER 1 — UNIVERSAL CUES (by step type)
// These short clips are the fallback for any step of a given type.
// One clip per step type. Reused hundreds of times across all exercises.
// ============================================================================

export const universalCues = {
  'breathe-in':    'cues/breathe-in',
  'breathe-out':   'cues/breathe-out',
  'hold':          'cues/hold',
  'pressure-hold': 'cues/hold',          // Same clip as hold — keep it simple
  'prompt':        null,                  // Prompts use coaching clips only, no generic fallback
  'cognitive':     null,                  // Always unique — no generic cue
  'disruption':    null,                  // Always unique — no generic cue
  'timed':         null,                  // Physical actions — use coaching clips
  'repeat':        null,                  // Invisible to user — no audio
};

// ============================================================================
// TIER 2 — COACHING CLIPS (by exact instruction string)
// Each key is the exact instruction text from data.js.
// Each value is the path relative to the voice's basePath (no extension).
//
// These override the universal cue when present.
// You can ship with an empty map and add clips over time —
// missing clips fall back to Tier 1 silently.
// ============================================================================

export const coachingClips = {

  // ── BREATHING IN — Contextual variants ──────────────────────────────────

  'Breathe in slowly through your nose.':
    'coaching/breathe-in-slowly-nose',

  'Find a comfortable rhythm. In through the nose.':
    'coaching/find-rhythm-in-nose',

  'Breathe in for 4 seconds.':
    'coaching/breathe-in-4-seconds',

  'Double inhale through your nose — one short, one long.':
    'coaching/double-inhale-nose',

  'Again. Two inhales through the nose.':
    'coaching/again-two-inhales',

  'One more. Double inhale.':
    'coaching/one-more-double-inhale',

  'Take a deep breath in.':
    'coaching/take-deep-breath-in',

  'Deep breath in.':
    'coaching/deep-breath-in',

  'Breathe in.':
    'coaching/breathe-in-short',

  'One more. Deep breath in.':
    'coaching/one-more-deep-breath-in',

  'Again. Quick in.':
    'coaching/again-quick-in',

  'Back to breathing. In.':
    'coaching/back-to-breathing-in',

  'Find the breath. In.':
    'coaching/find-the-breath-in',

  'New breath. In.':
    'coaching/new-breath-in',

  'Breathe in. Slow and steady.':
    'coaching/breathe-in-slow-steady',

  'Breathe in. Rebuild the rhythm.':
    'coaching/breathe-in-rebuild-rhythm',

  'Once more. Breathe in slowly.':
    'coaching/once-more-breathe-in-slowly',

  // ── BREATHING OUT — Contextual variants ─────────────────────────────────

  'Breathe out slowly through your mouth.':
    'coaching/breathe-out-slowly-mouth',

  'Slow exhale. Let your body settle.':
    'coaching/slow-exhale-body-settle',

  'Exhale for 8 seconds. Twice as long as your inhale.':
    'coaching/exhale-8-seconds',

  'Slow exhale through your mouth. As long as you can.':
    'coaching/slow-exhale-as-long-as-you-can',

  'Long slow exhale. Feel the release.':
    'coaching/long-slow-exhale-feel-release',

  'Slowest exhale yet. Let everything go.':
    'coaching/slowest-exhale-let-everything-go',

  'Exhale slowly.':
    'coaching/exhale-slowly',

  'Exhale.':
    'coaching/exhale',

  'Exhale. Let it go.':
    'coaching/exhale-let-it-go',

  'Release. Slow exhale.':
    'coaching/release-slow-exhale',

  'Release. Long slow exhale.':
    'coaching/release-long-slow-exhale',

  'Release. Done.':
    'coaching/release-done',

  'Release. Long exhale.':
    'coaching/release-long-exhale',

  'Slow exhale. Ignore the timer.':
    'coaching/slow-exhale-ignore-timer',

  'Exhale slowly. Longer than the inhale.':
    'coaching/exhale-slowly-longer-than-inhale',

  'Slow exhale. Feel the rhythm.':
    'coaching/slow-exhale-feel-rhythm',

  'Long exhale. Your body knows the rhythm now.':
    'coaching/long-exhale-body-knows-rhythm',

  'Exhale slowly. Each breath gets easier.':
    'coaching/exhale-slowly-each-easier',

  'Exhale. You can recover from disruption.':
    'coaching/exhale-recover-from-disruption',

  'Exhale. Stories come and go. You stay.':
    'coaching/exhale-stories-come-and-go',

  'Exhale slowly. Come back to the breath.':
    'coaching/exhale-slowly-come-back',

  'Release. Exhale slowly.':
    'coaching/release-exhale-slowly',

  'Exhale. Reset complete.':
    'coaching/exhale-reset-complete',

  'Release. You held composure under double load.':
    'coaching/release-composure-double-load',

  'Release. Slow exhale. You\'re back.':
    'coaching/release-slow-exhale-youre-back',

  'Release. Long exhale. Longest you can.':
    'coaching/release-long-exhale-longest',

  'Release. Done. Three holds. You stayed steady through all of them.':
    'coaching/release-done-three-holds-steady',

  'Release. That was the hardest one. And you recovered.':
    'coaching/release-hardest-one-recovered',

  // ── HOLDS — Contextual variants ─────────────────────────────────────────

  'Hold your breath for 4 seconds.':
    'coaching/hold-breath-4-seconds',

  'Hold. Stay relaxed. Notice the urge to breathe.':
    'coaching/hold-stay-relaxed-notice-urge',

  'Hold longer this time. Relax your shoulders.':
    'coaching/hold-longer-relax-shoulders',

  'Hold. Stay steady while your body wants to react.':
    'coaching/hold-stay-steady-body-react',

  'Hold. Stay soft. Watch the urge to breathe come and go.':
    'coaching/hold-stay-soft-urge-come-go',

  'Hold. Longer this time. Relax your face. Relax your hands.':
    'coaching/hold-longer-relax-face-hands',

  'Hold.':
    'coaching/hold-short',

  'Hold longer.':
    'coaching/hold-longer',

  'Hold — 10 seconds. Comfortable zone.':
    'coaching/hold-10-comfortable',

  'Hold — 15 seconds. This is the peak. Stay soft.':
    'coaching/hold-15-peak-stay-soft',

  'Hold — 12 seconds. Easier now. You know you can.':
    'coaching/hold-12-easier-now',

  'Hold. Stay relaxed.':
    'coaching/hold-stay-relaxed',

  'Hold. You know it passes.':
    'coaching/hold-you-know-it-passes',

  // ── PROMPTS — Coaching / setup / transition ─────────────────────────────

  'Drop your shoulders. Unclench your jaw.':
    'coaching/drop-shoulders-unclench-jaw',

  'Notice how your body feels now.':
    'coaching/notice-how-body-feels',

  'Continue this rhythm. Each breath a little deeper.':
    'coaching/continue-rhythm-deeper',

  'Breathe normally. Notice: you\'re fine.':
    'coaching/breathe-normally-youre-fine',

  'Normal breathing. The discomfort passed. It always does.':
    'coaching/normal-breathing-discomfort-passed',

  'Normal breathing. Easy.':
    'coaching/normal-breathing-easy',

  'Normal breathing. The hardest part is done.':
    'coaching/normal-breathing-hardest-done',

  'Normal breathing. You\'re fine. You\'re always fine after.':
    'coaching/normal-breathing-always-fine',

  'Normal breathing. That was harder. And you handled it.':
    'coaching/normal-breathing-harder-handled',

  'Breathe normally for a moment. Center yourself.':
    'coaching/breathe-normally-center',

  'Normal breath. Reset.':
    'coaching/normal-breath-reset',

  'We\'re going to practice tolerating mild discomfort. Breathe normally for a moment.':
    'coaching/practice-tolerating-discomfort',

  'Breathe normally. Focus on each breath.':
    'coaching/breathe-normally-focus',

  'Continue breathing. Let the thinking be loose, not perfect.':
    'coaching/continue-breathing-loose-thinking',

  'Slow breathing: 4 in, 6 out. You\'ll be interrupted. Find your breath each time.':
    'coaching/slow-breathing-interrupted',

  'Three holds. They\'ll get harder, then ease back.':
    'coaching/three-holds-harder-then-ease',

  'Holds and disruptions together. The hardest combo before the full stack.':
    'coaching/holds-disruptions-hardest-combo',

  'Phase 2 capstone. Holds, thinking, timer. No disruptions yet.':
    'coaching/phase-2-capstone',

  'We\'re combining holds with thinking. Breathe normally.':
    'coaching/combining-holds-thinking',

  // ── Scenario / visualization prompts ────────────────────────────────────

  'Close your eyes. Think of a real situation that stresses you. Something recent. Hold it in your mind.':
    'coaching/close-eyes-stressful-situation',

  'The stress is there. It\'s just a thought. Breathe through it.':
    'coaching/stress-is-just-a-thought',

  'Still holding the scenario. Notice what your body does.':
    'coaching/still-holding-scenario-notice',

  'The scenario is fading. You\'re calm. That\'s the skill.':
    'coaching/scenario-fading-thats-the-skill',

  // ── Body scan / grounding prompts ───────────────────────────────────────

  'Close your eyes. Start at the top of your head. Just notice what you feel.':
    'coaching/close-eyes-top-of-head',

  'Move your attention down to your face. Forehead, jaw, eyes.':
    'coaching/attention-face-forehead-jaw',

  'Down to your shoulders and arms. Notice tension. Don\'t fix it.':
    'coaching/shoulders-arms-notice-tension',

  'Your chest and stomach. Feel them rise and fall.':
    'coaching/chest-stomach-rise-fall',

  'Your legs and feet. Feel the weight. The ground beneath you.':
    'coaching/legs-feet-weight-ground',

  'Look around. Name 5 things you can see.':
    'coaching/look-around-5-things-see',

  'Name 4 things you can touch or feel.':
    'coaching/name-4-things-touch',

  'Name 3 things you can hear.':
    'coaching/name-3-things-hear',

  'Name 2 things you can smell.':
    'coaching/name-2-things-smell',

  'Name 1 thing you can taste.':
    'coaching/name-1-thing-taste',

  'Now take a slow breath. You\'re here. You\'re grounded.':
    'coaching/slow-breath-youre-grounded',

  // ── Thought labeling / unhooking prompts ────────────────────────────────

  'Notice the thought that\'s loudest right now. Don\'t push it away.':
    'coaching/notice-loudest-thought',

  'Label it. "I\'m having the thought that..."':
    'coaching/label-it-having-the-thought',

  'Imagine placing that thought on a leaf floating down a stream.':
    'coaching/imagine-leaf-floating-stream',

  'Imagine a gentle stream with leaves floating by.':
    'coaching/imagine-gentle-stream-leaves',

  'Watch the next thought arrive. Label it. Place it on a leaf.':
    'coaching/watch-next-thought-label',

  // ── PMR / body tension prompts ──────────────────────────────────────────

  'Squeeze both fists as hard as you can.':
    'coaching/squeeze-both-fists',

  'Release. Let them fall open. Notice the difference.':
    'coaching/release-let-them-fall',

  'Shrug your shoulders up to your ears. Tight.':
    'coaching/shrug-shoulders-tight',

  'Drop them. Let the tension drain.':
    'coaching/drop-them-tension-drain',

  'Clench your jaw. Tight.':
    'coaching/clench-jaw-tight',

  'Release. Let your mouth hang slightly open.':
    'coaching/release-mouth-hang-open',

  'Tense your whole body. Everything tight.':
    'coaching/tense-whole-body',

  'Release everything at once. Let it all go.':
    'coaching/release-everything-at-once',

  // ── Orienting / look around prompts ─────────────────────────────────────

  'Look slowly to your left. What do you see? Notice details.':
    'coaching/look-slowly-left',

  'Now slowly look right. Take in whatever\'s there.':
    'coaching/look-slowly-right',

  'Look up. Then down. Move slowly. Notice what catches your eye.':
    'coaching/look-up-then-down',

  // ── Pendulation / tension-ease prompts ──────────────────────────────────

  'Find a spot in your body that feels tense or uncomfortable. Focus there.':
    'coaching/find-tense-spot',

  'Now find a spot that feels okay. Relaxed, neutral, or even pleasant.':
    'coaching/find-okay-spot',

  'Move your attention back to the tense spot. Just notice it.':
    'coaching/attention-back-tense',

  'Back to the comfortable spot. Rest there.':
    'coaching/back-to-comfortable-rest',

  'One more time. The tense spot. It doesn\'t need fixing.':
    'coaching/tense-spot-no-fixing',

  'Return to comfort. Your body can hold both.':
    'coaching/return-to-comfort-both',

  // ── Shake / tremor release prompts ──────────────────────────────────────

  'Stand if you can. Feet shoulder-width apart.':
    'coaching/stand-feet-shoulder-width',

  'Gently shake your hands. Let them be loose.':
    'coaching/shake-hands-loose',

  'Now your arms. Shake from the shoulders down.':
    'coaching/shake-arms-from-shoulders',

  'Shake your whole body. Knees, hips, shoulders. Let it all move.':
    'coaching/shake-whole-body',

  'Slow it down. Smaller movements.':
    'coaching/slow-it-down-smaller',

  'Stillness. Notice the buzzing in your body. That\'s energy moving.':
    'coaching/stillness-buzzing-energy',

  // ── Cold exposure breathing prompts ─────────────────────────────────────

  'Sharp breath in. Fill your lungs completely.':
    'coaching/sharp-breath-in-fill-lungs',

  'Forceful exhale. Push all the air out.':
    'coaching/forceful-exhale-push-out',

  'Normal breathing. Notice the energy in your body.':
    'coaching/normal-breathing-notice-energy',

  'Fast in. Power breath.':
    'coaching/fast-in-power-breath',

  'Fast out. Empty.':
    'coaching/fast-out-empty',

  'Normal breathing. You should feel alert and awake.':
    'coaching/normal-breathing-alert-awake',

  // ── Disruptions (RESET prompts) ─────────────────────────────────────────

  'RESET — What color is the nearest wall?':
    'coaching/reset-color-nearest-wall',

  'RESET — Clench your fists tight. Now release.':
    'coaching/reset-clench-fists-release',

  'RESET — Hold your breath for 3 seconds.':
    'coaching/reset-hold-breath-3',

  'RESET — Open your eyes wide. Now soften them.':
    'coaching/reset-open-eyes-soften',

  'RESET — Name the last thing you ate.':
    'coaching/reset-last-thing-ate',

  'RESET — Press your feet hard into the floor. Release.':
    'coaching/reset-press-feet-release',

  'RESET — What sound can you hear right now?':
    'coaching/reset-what-sound',

  'RESET — Shrug your shoulders to your ears. Drop them.':
    'coaching/reset-shrug-shoulders-drop',

  'RESET — Take one sharp breath in. Now slow it down.':
    'coaching/reset-sharp-breath-slow',

  'RESET — Wiggle your fingers. Now stop. Be still.':
    'coaching/reset-wiggle-fingers-still',

  'RESET — What\'s the temperature of your hands?':
    'coaching/reset-temperature-hands',

  'RESET — Squeeze your jaw. Release. Let it hang.':
    'coaching/reset-squeeze-jaw-release',

  'RESET — Tap your collarbone twice. Back to breathing.':
    'coaching/reset-tap-collarbone',

  'RESET — Blink 5 times fast. Now slow.':
    'coaching/reset-blink-5-times',

  'RESET — Name 2 things you can see. Go.':
    'coaching/reset-name-2-things-see',

  // ── Cognitive tasks — Tier 1 ────────────────────────────────────────────

  'Count backwards from 20 by 2s.':
    'coaching/count-back-20-by-2',

  'Name 3 fruits.':
    'coaching/name-3-fruits',

  'What month comes after October?':
    'coaching/month-after-october',

  'Spell the word "calm" backwards.':
    'coaching/spell-calm-backwards',

  'What\'s 7 + 8?':
    'coaching/whats-7-plus-8',

  'Name 3 colors you can see right now.':
    'coaching/name-3-colors-see',

  'What day of the week was yesterday?':
    'coaching/what-day-yesterday',

  'Think of 2 words that start with S.':
    'coaching/two-words-start-s',

  'What\'s 12 - 5?':
    'coaching/whats-12-minus-5',

  'Name something you drank today.':
    'coaching/name-something-drank',

  'Count backwards from 10 to 1.':
    'coaching/count-back-10-to-1',

  'What\'s 6 + 9?':
    'coaching/whats-6-plus-9',

  'Name 2 animals that fly.':
    'coaching/name-2-animals-fly',

  'Spell the word "step" backwards.':
    'coaching/spell-step-backwards',

  'What comes after Wednesday?':
    'coaching/what-after-wednesday',

  // ── Cognitive tasks — Tier 2 ────────────────────────────────────────────

  'Count backwards from 50 by 3s.':
    'coaching/count-back-50-by-3',

  'Name 5 animals that aren\'t pets.':
    'coaching/name-5-animals-not-pets',

  'What day is it 4 days from now?':
    'coaching/what-day-4-from-now',

  'Think of 3 words that start with R.':
    'coaching/three-words-start-r',

  'What\'s 23 - 7?':
    'coaching/whats-23-minus-7',

  'Name 4 countries in Europe.':
    'coaching/name-4-countries-europe',

  'What\'s 8 × 3?':
    'coaching/whats-8-times-3',

  'Think of a word that rhymes with "light."':
    'coaching/word-rhymes-light',

  'Name 3 things in your pocket or nearby.':
    'coaching/name-3-things-nearby',

  'Count backwards from 30 by 4s.':
    'coaching/count-back-30-by-4',

  'What month is 3 months from now?':
    'coaching/what-month-3-from-now',

  'Name 3 foods that are green.':
    'coaching/name-3-foods-green',

  'What\'s 15 + 18?':
    'coaching/whats-15-plus-18',

  'Think of 3 words that end with "-tion."':
    'coaching/three-words-end-tion',

  'Spell the word "steady" backwards.':
    'coaching/spell-steady-backwards',

  // ── Cognitive tasks — Tier 3 ────────────────────────────────────────────

  'Count backwards from 100 by 7s.':
    'coaching/count-back-100-by-7',

  'Name a country for each letter: A, B, C.':
    'coaching/country-for-abc',

  'What\'s 8 × 7?':
    'coaching/whats-8-times-7',

  'Think of a word that rhymes with "pressure."':
    'coaching/word-rhymes-pressure',

  'Spell a 6-letter word backwards.':
    'coaching/spell-6-letter-backwards',

  'Name 3 rivers on different continents.':
    'coaching/name-3-rivers-continents',

  'What\'s 64 ÷ 8?':
    'coaching/whats-64-divided-8',

  'Think of 4 words that start with the same letter.':
    'coaching/four-words-same-letter',

  'Name the months of the year backwards from December.':
    'coaching/months-backwards-december',

  'What\'s 17 + 26?':
    'coaching/whats-17-plus-26',

  'Name 3 capital cities.':
    'coaching/name-3-capital-cities',

  'Count backwards from 80 by 6s.':
    'coaching/count-back-80-by-6',

  'Think of 5 animals. Go.':
    'coaching/think-5-animals-go',

  'What\'s 13 × 4?':
    'coaching/whats-13-times-4',

  'Name something for each sense: see, hear, feel.':
    'coaching/something-each-sense',
};


// ============================================================================
// LOOKUP FUNCTION
// ============================================================================

/**
 * Resolve the audio clip path for a given step.
 * Priority: exact instruction match → step type fallback → null (silent)
 *
 * @param {Object} step - Step object with { instruction, type }
 * @param {string} voiceId - Voice ID (e.g. 'john', 'jane')
 * @returns {string|null} Full path to audio file, or null if no clip available
 */
export function resolveClipPath(step, voiceId) {
  if (!step) return null;

  const voice = voices[voiceId] || voices[DEFAULT_VOICE];
  const basePath = voice.basePath;

  // Priority 1: Exact instruction match in coaching clips
  if (step.instruction && coachingClips[step.instruction]) {
    return `${basePath}/${coachingClips[step.instruction]}.mp3`;
  }

  // Priority 2: Universal cue by step type
  if (step.type && universalCues[step.type]) {
    return `${basePath}/${universalCues[step.type]}.mp3`;
  }

  // Priority 3: No clip — silent
  return null;
}

/**
 * Check if a clip exists for a step (without resolving the full path).
 * Useful for UI decisions (e.g. whether to show visual cue instead).
 *
 * @param {Object} step - Step object with { instruction, type }
 * @returns {boolean} Whether a voice clip is mapped for this step
 */
export function hasClip(step) {
  if (!step) return false;
  if (step.instruction && coachingClips[step.instruction]) return true;
  if (step.type && universalCues[step.type]) return true;
  return false;
}
