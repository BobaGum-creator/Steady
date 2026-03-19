export const exercises = [
  {
    id: 'physiological-sigh',
    title: 'Emergency Calm',
    subtitle: 'A powerful breathwork pattern to calm your nervous system fast.',
    category: 'breathwork',
    mode: 'relief',
    duration: 90,
    signals: ['breath', 'pressure'],
    evidence: 'strong',
    steps: [
      { instruction: 'Drop your shoulders. Unclench your jaw.', duration: 5, type: 'prompt' },
      { instruction: 'Double inhale through your nose — one short, one long.', duration: 4, type: 'breathe-in' },
      { instruction: 'Slow exhale through your mouth. As long as you can.', duration: 8, type: 'breathe-out' },
      { instruction: 'Again. Two inhales through the nose.', duration: 4, type: 'breathe-in' },
      { instruction: 'Long slow exhale. Feel the release.', duration: 8, type: 'breathe-out' },
      { instruction: 'One more. Double inhale.', duration: 4, type: 'breathe-in' },
      { instruction: 'Slowest exhale yet. Let everything go.', duration: 10, type: 'breathe-out' },
      { instruction: 'Notice how your body feels now. The shift is real.', duration: 5, type: 'prompt' }
    ]
  },
  {
    id: 'resonant-breathing',
    title: '3-Minute Reset',
    subtitle: 'Find your natural rhythm and let your body settle into calm.',
    category: 'breathwork',
    mode: 'both',
    duration: 180,
    signals: ['breath', 'body'],
    evidence: 'strong',
    steps: [
      { instruction: 'Breathe in slowly through your nose.', duration: 5, type: 'breathe-in' },
      { instruction: 'Breathe out slowly through your mouth.', duration: 5, type: 'breathe-out' },
      { instruction: 'Find a comfortable rhythm. In through the nose.', duration: 5, type: 'breathe-in' },
      { instruction: 'Slow exhale. Let your body settle.', duration: 5, type: 'breathe-out' },
      { instruction: 'Continue this rhythm. Each breath a little deeper.', duration: null, type: 'repeat' }
    ]
  },
  {
    id: 'extended-exhale',
    title: 'Slow Down',
    subtitle: 'Calm your nervous system by making your exhales longer than inhales.',
    category: 'breathwork',
    mode: 'both',
    duration: 120,
    signals: ['breath', 'pressure'],
    evidence: 'moderate',
    steps: [
      { instruction: 'Breathe in for 4 seconds.', duration: 4, type: 'breathe-in' },
      { instruction: 'Now exhale for 8 seconds. Twice as long.', duration: 8, type: 'breathe-out' },
      { instruction: 'In again, 4 seconds.', duration: 4, type: 'breathe-in' },
      { instruction: 'Long exhale, 8 seconds. The exhale is where calm lives.', duration: 8, type: 'breathe-out' },
      { instruction: 'Continue. 4 in, 8 out.', duration: null, type: 'repeat' }
    ]
  },
  {
    id: 'pmr-short',
    title: 'Body Tension Reset',
    subtitle: 'Release physical tension by tensing and relaxing muscle groups.',
    category: 'body',
    mode: 'training',
    duration: 240,
    signals: ['body'],
    evidence: 'strong',
    steps: [
      { instruction: 'We\'ll tense and release muscle groups. Start with your hands.', duration: 5, type: 'prompt' },
      { instruction: 'Make tight fists. Squeeze hard.', duration: 5, type: 'timed' },
      { instruction: 'Release. Feel the contrast.', duration: 10, type: 'timed' },
      { instruction: 'Shoulders up to your ears. Hold the tension.', duration: 5, type: 'timed' },
      { instruction: 'Drop them. Let them fall heavy.', duration: 10, type: 'timed' },
      { instruction: 'Tighten your whole face. Scrunch everything.', duration: 5, type: 'timed' },
      { instruction: 'Release. Smooth and soft.', duration: 10, type: 'timed' },
      { instruction: 'Tense your legs. Push your feet into the floor.', duration: 5, type: 'timed' },
      { instruction: 'Release everything. Scan for any remaining tension.', duration: 10, type: 'timed' },
      { instruction: 'Take a deep breath in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Exhale and let the last tension go.', duration: 8, type: 'breathe-out' }
    ]
  },
  {
    id: 'grounding-54321',
    title: 'Stop the Spiral',
    subtitle: 'Use your senses to anchor yourself to the present moment.',
    category: 'mind',
    mode: 'relief',
    duration: 180,
    signals: ['mind', 'pressure'],
    evidence: 'moderate',
    steps: [
      { instruction: 'Look around. Name 5 things you can see.', duration: 15, type: 'prompt' },
      { instruction: 'Notice 4 things you can touch. Feel their texture.', duration: 15, type: 'prompt' },
      { instruction: 'Listen for 3 sounds. Even quiet ones.', duration: 15, type: 'prompt' },
      { instruction: 'Find 2 things you can smell.', duration: 10, type: 'prompt' },
      { instruction: 'Notice 1 thing you can taste.', duration: 8, type: 'prompt' },
      { instruction: 'Take a slow breath in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Exhale. You\'re here. You\'re present.', duration: 8, type: 'breathe-out' }
    ]
  },
  {
    id: 'name-the-story',
    title: 'Unhook from Thoughts',
    subtitle: 'Separate yourself from unhelpful stories your mind tells.',
    category: 'mind',
    mode: 'training',
    duration: 120,
    signals: ['mind'],
    evidence: 'moderate',
    steps: [
      { instruction: 'Notice what your mind is saying right now.', duration: 10, type: 'prompt' },
      { instruction: 'Can you name the story? \'I\'m telling myself that...\'', duration: 15, type: 'prompt' },
      { instruction: 'That\'s just a story. Not a fact. Notice the difference.', duration: 10, type: 'prompt' },
      { instruction: 'Breathe in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Breathe out. Let the story be there without believing it.', duration: 8, type: 'breathe-out' },
      { instruction: 'What\'s another story your mind tells often?', duration: 15, type: 'prompt' },
      { instruction: 'Name it. \'There\'s the [worry/judgment/prediction] story again.\'', duration: 10, type: 'prompt' },
      { instruction: 'Breathe in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Exhale. Stories come and go. You stay.', duration: 8, type: 'breathe-out' }
    ]
  },
  {
    id: 'leaves-on-stream',
    title: 'Let Thoughts Pass',
    subtitle: 'Watch your thoughts drift away without grabbing onto them.',
    category: 'mind',
    mode: 'training',
    duration: 180,
    signals: ['mind', 'pressure'],
    evidence: 'moderate',
    steps: [
      { instruction: 'Imagine a gentle stream with leaves floating by.', duration: 8, type: 'prompt' },
      { instruction: 'Each thought that comes — place it on a leaf.', duration: 10, type: 'prompt' },
      { instruction: 'Watch it drift downstream. Don\'t chase it.', duration: 10, type: 'prompt' },
      { instruction: 'Breathe in slowly.', duration: 5, type: 'breathe-in' },
      { instruction: 'Breathe out. Another leaf, another thought.', duration: 8, type: 'breathe-out' },
      { instruction: 'No thought is urgent right now. Let each one float.', duration: 10, type: 'prompt' },
      { instruction: 'Breathe in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Exhale. Some leaves move fast, some slow. Just watch.', duration: 8, type: 'breathe-out' },
      { instruction: 'Continue placing thoughts on leaves.', duration: null, type: 'repeat' }
    ]
  },
  {
    id: 'stress-journal',
    title: 'Quick Unload',
    subtitle: 'Get stress out of your head by naming what\'s real and what\'s next.',
    category: 'quick',
    mode: 'relief',
    duration: 60,
    signals: ['mind', 'pressure'],
    evidence: 'moderate',
    steps: [
      { instruction: 'What\'s stressing you right now? Get it out of your head.', duration: 20, type: 'prompt' },
      { instruction: 'What\'s actually in your control?', duration: 15, type: 'prompt' },
      { instruction: 'What\'s one small next step?', duration: 15, type: 'prompt' },
      { instruction: 'Take a breath. You\'ve named it. That\'s the first step.', duration: 5, type: 'breathe-in' },
      { instruction: 'Exhale. Clarity comes from getting it out.', duration: 5, type: 'breathe-out' }
    ]
  },
  {
    id: 'orienting-response',
    title: 'Look Around',
    subtitle: 'Use your eyes to signal safety to your nervous system.',
    category: 'body',
    mode: 'both',
    duration: 120,
    signals: ['pressure', 'body'],
    evidence: 'emerging',
    steps: [
      { instruction: 'Slowly turn your head to the right. What do you see?', duration: 10, type: 'prompt' },
      { instruction: 'Now slowly to the left. Take in the space.', duration: 10, type: 'prompt' },
      { instruction: 'Look up. Notice the ceiling, sky, or space above.', duration: 8, type: 'prompt' },
      { instruction: 'Look down. Feel your feet on the ground.', duration: 8, type: 'prompt' },
      { instruction: 'Breathe in as you look straight ahead.', duration: 5, type: 'breathe-in' },
      { instruction: 'Exhale. Your nervous system is reading the environment.', duration: 8, type: 'breathe-out' },
      { instruction: 'Slowly look around once more. You\'re safe here.', duration: 10, type: 'prompt' },
      { instruction: 'Breathe in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Exhale. Settled.', duration: 8, type: 'breathe-out' }
    ]
  },
  {
    id: 'pendulation',
    title: 'Tension and Ease',
    subtitle: 'Learn to move your attention between discomfort and relief.',
    category: 'body',
    mode: 'training',
    duration: 150,
    signals: ['body', 'pressure'],
    evidence: 'emerging',
    steps: [
      { instruction: 'Notice somewhere in your body that feels tense or uncomfortable.', duration: 10, type: 'prompt' },
      { instruction: 'Stay with that feeling for a moment. Don\'t try to fix it.', duration: 10, type: 'prompt' },
      { instruction: 'Now find somewhere that feels okay. Neutral or comfortable.', duration: 10, type: 'prompt' },
      { instruction: 'Rest your attention there. Feel the ease.', duration: 10, type: 'prompt' },
      { instruction: 'Breathe in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Exhale. Gently move attention back to the tense spot.', duration: 8, type: 'breathe-out' },
      { instruction: 'And back to the comfortable spot.', duration: 10, type: 'prompt' },
      { instruction: 'Breathe in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Exhale. Your body holds both. Tension and ease, always.', duration: 8, type: 'breathe-out' }
    ]
  },
  {
    id: 'tremor-release',
    title: 'Shake It Off',
    subtitle: 'Move stress through your body with shaking and tremor.',
    category: 'body',
    mode: 'both',
    duration: 120,
    signals: ['body', 'pressure'],
    evidence: 'emerging',
    steps: [
      { instruction: 'Stand up if you can. Shake your hands loosely.', duration: 10, type: 'timed' },
      { instruction: 'Shake your arms. Let them be floppy.', duration: 10, type: 'timed' },
      { instruction: 'Bounce on your feet. Gentle shaking.', duration: 15, type: 'timed' },
      { instruction: 'Shake everything. Arms, legs, shoulders. Like a dog after water.', duration: 15, type: 'timed' },
      { instruction: 'Slow down gradually. Let the movement fade.', duration: 10, type: 'timed' },
      { instruction: 'Stand still. Feel the buzzing in your body.', duration: 8, type: 'prompt' },
      { instruction: 'Breathe in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Exhale. The energy has moved through you.', duration: 8, type: 'breathe-out' }
    ]
  },
  {
    id: 'box-breathing',
    title: 'Box Breathing',
    subtitle: 'A balanced breathing pattern: in, hold, out, hold. Repeat.',
    category: 'breathwork',
    mode: 'both',
    duration: 180,
    signals: ['breath', 'mind'],
    evidence: 'strong',
    steps: [
      { instruction: 'Breathe in for 4 counts.', duration: 4, type: 'breathe-in' },
      { instruction: 'Hold for 4 counts.', duration: 4, type: 'hold' },
      { instruction: 'Breathe out for 4 counts.', duration: 4, type: 'breathe-out' },
      { instruction: 'Hold for 4 counts.', duration: 4, type: 'hold' },
      { instruction: 'Continue the box. 4 in, 4 hold, 4 out, 4 hold.', duration: null, type: 'repeat' }
    ]
  },
  {
    id: 'body-scan',
    title: 'Body Scan',
    subtitle: 'Move your attention through your whole body to release tension.',
    category: 'body',
    mode: 'training',
    duration: 180,
    signals: ['body', 'breath'],
    evidence: 'moderate',
    steps: [
      { instruction: 'Close your eyes or soften your gaze.', duration: 5, type: 'prompt' },
      { instruction: 'Bring attention to the top of your head.', duration: 8, type: 'prompt' },
      { instruction: 'Move down to your face. Jaw. Release any clenching.', duration: 10, type: 'prompt' },
      { instruction: 'Neck and shoulders. Let them drop.', duration: 10, type: 'prompt' },
      { instruction: 'Arms and hands. Let them be heavy.', duration: 10, type: 'prompt' },
      { instruction: 'Chest and stomach. Notice your breathing.', duration: 10, type: 'prompt' },
      { instruction: 'Breathe in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Exhale into any tension you found.', duration: 8, type: 'breathe-out' },
      { instruction: 'Hips, legs, feet. Feel the weight.', duration: 10, type: 'prompt' },
      { instruction: 'Breathe in. Whole body.', duration: 5, type: 'breathe-in' },
      { instruction: 'Exhale. Whole body softens.', duration: 8, type: 'breathe-out' }
    ]
  },
  {
    id: 'cold-exposure-breathing',
    title: 'Cold Reset',
    subtitle: 'Rapid breathing to activate your parasympathetic nervous system.',
    category: 'breathwork',
    mode: 'training',
    duration: 120,
    signals: ['breath', 'pressure'],
    evidence: 'emerging',
    steps: [
      { instruction: 'Sit comfortably. Stop if you feel dizzy.', duration: 5, type: 'prompt' },
      { instruction: 'Sharp inhale through the nose.', duration: 2, type: 'breathe-in' },
      { instruction: 'Sharp exhale through the mouth.', duration: 2, type: 'breathe-out' },
      { instruction: 'Again. Quick in.', duration: 2, type: 'breathe-in' },
      { instruction: 'Quick out.', duration: 2, type: 'breathe-out' },
      { instruction: 'Continue this rapid rhythm. 10 more breaths.', duration: 20, type: 'timed' },
      { instruction: 'Stop. Take a deep breath in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Hold.', duration: 10, type: 'hold' },
      { instruction: 'Slow exhale. Feel the shift.', duration: 8, type: 'breathe-out' },
      { instruction: 'Normal breathing now. Notice the buzz.', duration: 10, type: 'prompt' }
    ]
  },
  {
    id: 'challenge-countdown',
    title: 'Countdown Calm',
    subtitle: 'Keep your breathing slow while the clock runs out.',
    category: 'breathwork',
    mode: 'challenge',
    duration: 60,
    signals: ['breath', 'pressure'],
    evidence: 'moderate',
    steps: [
      { instruction: 'Breathe in slowly through your nose.', duration: 4, type: 'breathe-in' },
      { instruction: 'Slow exhale. Ignore the timer.', duration: 6, type: 'breathe-out' },
      { instruction: 'Again. The clock doesn\'t control your breath.', duration: 4, type: 'breathe-in' },
      { instruction: 'Slow exhale. You set the pace.', duration: 6, type: 'breathe-out' },
      { instruction: 'Continue this rhythm until time runs out.', duration: null, type: 'repeat' }
    ]
  },
  {
    id: 'challenge-cognitive',
    title: 'Breathe and Think',
    subtitle: 'Maintain your breathing rhythm while doing a mental task.',
    category: 'mind',
    mode: 'challenge',
    duration: 75,
    signals: ['mind', 'breath'],
    evidence: 'moderate',
    steps: [
      { instruction: 'We\'ll add a mental task to your breathing. Start with box breathing: 4 in, 4 hold, 4 out, 4 hold.', duration: 8, type: 'prompt' },
      { instruction: 'Breathe in.', duration: 4, type: 'breathe-in' },
      { instruction: 'Hold. Count backwards from 10.', duration: 4, type: 'cognitive' },
      { instruction: 'Exhale slowly.', duration: 4, type: 'breathe-out' },
      { instruction: 'Hold. What day of the week is it three days from now?', duration: 4, type: 'cognitive' },
      { instruction: 'Breathe in.', duration: 4, type: 'breathe-in' },
      { instruction: 'Hold. Think of 3 words that start with R.', duration: 4, type: 'cognitive' },
      { instruction: 'Exhale slowly.', duration: 4, type: 'breathe-out' },
      { instruction: 'Hold. Count backwards from 50 by 3s.', duration: 4, type: 'cognitive' },
      { instruction: 'Continue breathing. Let the thinking be loose, not perfect.', duration: null, type: 'repeat' }
    ]
  },
  {
    id: 'challenge-extended',
    title: 'Pressure Hold',
    subtitle: 'Practice staying calm during mild physical discomfort.',
    category: 'breathwork',
    mode: 'challenge',
    duration: 90,
    signals: ['breath', 'body', 'pressure'],
    evidence: 'moderate',
    steps: [
      { instruction: 'We\'re going to practice tolerating mild discomfort. Breathe normally for a moment.', duration: 10, type: 'prompt' },
      { instruction: 'Take a deep breath in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Hold. Stay relaxed. Notice the urge to breathe without reacting to it.', duration: 10, type: 'pressure-hold' },
      { instruction: 'Release. Slow exhale.', duration: 8, type: 'breathe-out' },
      { instruction: 'Breathe normally. Notice: you\'re fine.', duration: 8, type: 'prompt' },
      { instruction: 'Deep breath in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Hold longer this time. Relax your shoulders. The discomfort is temporary.', duration: 15, type: 'pressure-hold' },
      { instruction: 'Release. Long slow exhale.', duration: 8, type: 'breathe-out' },
      { instruction: 'Normal breathing. The discomfort passed. It always does.', duration: 10, type: 'prompt' },
      { instruction: 'One more. Deep breath in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Hold. This is the skill — staying steady when your body wants to react.', duration: 12, type: 'pressure-hold' },
      { instruction: 'Release. Done.', duration: 6, type: 'breathe-out' }
    ]
  },
  {
    id: 'challenge-disruption',
    title: 'Stay With It',
    subtitle: 'Recover your rhythm when something disrupts it.',
    category: 'mind',
    mode: 'challenge',
    duration: 90,
    signals: ['mind', 'breath', 'pressure'],
    evidence: 'moderate',
    steps: [
      { instruction: 'Slow breathing. 4 in, 6 out. We\'ll interrupt you. Your job: find your breath again.', duration: 8, type: 'prompt' },
      { instruction: 'Breathe in.', duration: 4, type: 'breathe-in' },
      { instruction: 'Exhale slowly.', duration: 6, type: 'breathe-out' },
      { instruction: 'Breathe in.', duration: 4, type: 'breathe-in' },
      { instruction: 'RESET — What color are the walls?', duration: 3, type: 'disruption' },
      { instruction: 'Find your breath. Slow exhale.', duration: 6, type: 'breathe-out' },
      { instruction: 'Breathe in.', duration: 4, type: 'breathe-in' },
      { instruction: 'Exhale.', duration: 6, type: 'breathe-out' },
      { instruction: 'RESET — Clench your fists tight. Now release.', duration: 5, type: 'disruption' },
      { instruction: 'Back to breathing. In.', duration: 4, type: 'breathe-in' },
      { instruction: 'Slow out.', duration: 6, type: 'breathe-out' },
      { instruction: 'RESET — Hold your breath for 3 seconds.', duration: 3, type: 'disruption' },
      { instruction: 'Release. Find the rhythm again.', duration: 6, type: 'breathe-out' },
      { instruction: 'Good. Keep breathing. You recovered every time.', duration: 8, type: 'prompt' }
    ]
  },
  {
    id: 'challenge-stack',
    title: 'Full Stack',
    subtitle: 'Everything at once. Timer, breathing, thinking, disruptions.',
    category: 'breathwork',
    mode: 'challenge',
    duration: 120,
    signals: ['breath', 'mind', 'pressure'],
    evidence: 'moderate',
    steps: [
      { instruction: 'This is the full challenge. Timer is running. Breathe slowly. Think clearly. Recover from interruptions.', duration: 8, type: 'prompt' },
      { instruction: 'Breathe in. Count backwards from 100 by 7s in your head.', duration: 4, type: 'breathe-in' },
      { instruction: 'Hold.', duration: 4, type: 'hold' },
      { instruction: 'Exhale. Keep counting.', duration: 4, type: 'breathe-out' },
      { instruction: 'Hold.', duration: 4, type: 'hold' },
      { instruction: 'RESET — Squeeze your hands tight. Release.', duration: 4, type: 'disruption' },
      { instruction: 'Find the breath. In.', duration: 4, type: 'breathe-in' },
      { instruction: 'Hold. What were you counting?', duration: 4, type: 'cognitive' },
      { instruction: 'Exhale.', duration: 4, type: 'breathe-out' },
      { instruction: 'Hold.', duration: 4, type: 'hold' },
      { instruction: 'In. Think of 5 animals.', duration: 4, type: 'breathe-in' },
      { instruction: 'Hold.', duration: 4, type: 'hold' },
      { instruction: 'RESET — Take one sharp breath. Now slow down.', duration: 4, type: 'disruption' },
      { instruction: 'Exhale. Slow. You control the pace.', duration: 6, type: 'breathe-out' },
      { instruction: 'Continue on your own. Breathe. Think. Recover.', duration: null, type: 'repeat' }
    ]
  },
  {
    id: 'challenge-scenario',
    title: 'Steady Under Fire',
    subtitle: 'Imagine a real pressure moment and stay regulated through it.',
    category: 'mind',
    mode: 'challenge',
    duration: 120,
    signals: ['mind', 'body', 'pressure'],
    evidence: 'moderate',
    steps: [
      { instruction: 'Think of a situation that makes you anxious. A call, a performance, a confrontation, a match. Hold it in mind.', duration: 10, type: 'prompt' },
      { instruction: 'Feel what happens in your body. Chest? Jaw? Stomach? Just notice it.', duration: 8, type: 'prompt' },
      { instruction: 'Now breathe. Slow inhale through your nose.', duration: 5, type: 'breathe-in' },
      { instruction: 'Long exhale. The situation is still there. You\'re still here.', duration: 8, type: 'breathe-out' },
      { instruction: 'Imagine it\'s happening now. The call is ringing. The tee shot is next. The room is watching.', duration: 8, type: 'prompt' },
      { instruction: 'Breathe in. You don\'t need to fix anything.', duration: 5, type: 'breathe-in' },
      { instruction: 'Exhale. Your one job: stay present.', duration: 8, type: 'breathe-out' },
      { instruction: 'The pressure is real. Your breathing is steady. Both are true.', duration: 8, type: 'prompt' },
      { instruction: 'Breathe in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Exhale. Let your shoulders drop.', duration: 8, type: 'breathe-out' },
      { instruction: 'The situation hasn\'t changed. But you\'re handling it. Notice that.', duration: 10, type: 'prompt' },
      { instruction: 'One more breath. In.', duration: 5, type: 'breathe-in' },
      { instruction: 'Out. You stayed steady under fire. That\'s the skill.', duration: 8, type: 'breathe-out' },
      { instruction: 'Done. Remember this feeling. This is what you\'re training for.', duration: 8, type: 'prompt' }
    ]
  },
  // ====================================================================
  // NEW EXERCISES FOR 28-DAY PROGRAM
  // ====================================================================

  // --- Foundation Phase Extensions ---
  {
    id: 'challenge-countdown-long',
    title: 'Countdown Calm (Extended)',
    subtitle: 'Longer session. Same slow breathing. The timer means nothing.',
    category: 'breathwork',
    mode: 'challenge',
    duration: 90,
    signals: ['breath', 'pressure'],
    evidence: 'moderate',
    steps: [
      { instruction: 'Breathe in slowly through your nose.', duration: 4, type: 'breathe-in' },
      { instruction: 'Slow exhale. The timer is just a number.', duration: 6, type: 'breathe-out' },
      { instruction: 'Again. You control the tempo.', duration: 4, type: 'breathe-in' },
      { instruction: 'Long exhale. Slower than feels natural.', duration: 7, type: 'breathe-out' },
      { instruction: 'Continue. Own the pace. The clock follows you.', duration: null, type: 'repeat' }
    ]
  },
  {
    id: 'challenge-cognitive-medium',
    title: 'Breathe and Think (Level 2)',
    subtitle: 'Harder mental tasks. Same steady breathing.',
    category: 'mind',
    mode: 'challenge',
    duration: 90,
    signals: ['mind', 'breath'],
    evidence: 'moderate',
    dynamicCognitive: true,
    cognitiveTier: 'tier2',
    steps: [
      { instruction: 'Box breathing with a harder mental task. 4 in, 4 hold, 4 out, 4 hold.', duration: 8, type: 'prompt' },
      { instruction: 'Breathe in.', duration: 4, type: 'breathe-in' },
      { instruction: null, duration: 5, type: 'cognitive-slot' },
      { instruction: 'Exhale slowly.', duration: 4, type: 'breathe-out' },
      { instruction: null, duration: 5, type: 'cognitive-slot' },
      { instruction: 'Breathe in.', duration: 4, type: 'breathe-in' },
      { instruction: null, duration: 5, type: 'cognitive-slot' },
      { instruction: 'Exhale slowly.', duration: 4, type: 'breathe-out' },
      { instruction: null, duration: 5, type: 'cognitive-slot' },
      { instruction: 'Continue breathing. Let the thinking be loose, not perfect.', duration: null, type: 'repeat' }
    ]
  },
  {
    id: 'challenge-foundation-cap',
    title: 'Foundation Test',
    subtitle: 'Timer running, easy cognitive task. Can you keep your rhythm?',
    category: 'breathwork',
    mode: 'challenge',
    duration: 90,
    signals: ['breath', 'mind', 'pressure'],
    evidence: 'moderate',
    dynamicCognitive: true,
    cognitiveTier: 'tier1',
    steps: [
      { instruction: 'Timer is running. Your job: breathe slowly and think clearly.', duration: 6, type: 'prompt' },
      { instruction: 'Breathe in.', duration: 4, type: 'breathe-in' },
      { instruction: 'Slow exhale.', duration: 6, type: 'breathe-out' },
      { instruction: 'Breathe in.', duration: 4, type: 'breathe-in' },
      { instruction: null, duration: 4, type: 'cognitive-slot' },
      { instruction: 'Exhale. Keep the rhythm.', duration: 6, type: 'breathe-out' },
      { instruction: 'Breathe in.', duration: 4, type: 'breathe-in' },
      { instruction: null, duration: 4, type: 'cognitive-slot' },
      { instruction: 'Exhale slowly. You handled both at once.', duration: 6, type: 'breathe-out' },
      { instruction: 'Continue on your own.', duration: null, type: 'repeat' }
    ]
  },

  // --- Pressure Phase Extensions ---
  {
    id: 'challenge-extended-long',
    title: 'Pressure Hold (Extended)',
    subtitle: 'Longer holds. The discomfort always passes.',
    category: 'breathwork',
    mode: 'challenge',
    duration: 100,
    signals: ['breath', 'body', 'pressure'],
    evidence: 'moderate',
    steps: [
      { instruction: 'Breathe normally for a moment. Center yourself.', duration: 10, type: 'prompt' },
      { instruction: 'Deep breath in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Hold. Stay soft. Watch the urge to breathe come and go.', duration: 15, type: 'pressure-hold' },
      { instruction: 'Release. Slow exhale.', duration: 8, type: 'breathe-out' },
      { instruction: 'Normal breathing. You\'re fine. You\'re always fine after.', duration: 8, type: 'prompt' },
      { instruction: 'Deep breath in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Hold. Longer this time. Relax your face. Relax your hands.', duration: 18, type: 'pressure-hold' },
      { instruction: 'Release. Long slow exhale.', duration: 8, type: 'breathe-out' },
      { instruction: 'Normal breathing. That was harder. And you handled it.', duration: 8, type: 'prompt' }
    ]
  },
  {
    id: 'challenge-cognitive-hard',
    title: 'Breathe and Think (Advanced)',
    subtitle: 'Demanding mental tasks while maintaining breathing rhythm.',
    category: 'mind',
    mode: 'challenge',
    duration: 100,
    signals: ['mind', 'breath'],
    evidence: 'moderate',
    dynamicCognitive: true,
    cognitiveTier: 'tier3',
    steps: [
      { instruction: 'Harder cognitive load now. Keep your breathing steady no matter what.', duration: 6, type: 'prompt' },
      { instruction: 'Breathe in.', duration: 4, type: 'breathe-in' },
      { instruction: null, duration: 6, type: 'cognitive-slot' },
      { instruction: 'Exhale slowly.', duration: 6, type: 'breathe-out' },
      { instruction: null, duration: 6, type: 'cognitive-slot' },
      { instruction: 'Breathe in. Don\'t speed up.', duration: 4, type: 'breathe-in' },
      { instruction: null, duration: 6, type: 'cognitive-slot' },
      { instruction: 'Exhale. Your breath is the anchor. Let thinking float around it.', duration: 6, type: 'breathe-out' },
      { instruction: null, duration: 6, type: 'cognitive-slot' },
      { instruction: 'Continue. Breathe first. Think second.', duration: null, type: 'repeat' }
    ]
  },
  {
    id: 'challenge-pressure-cognitive',
    title: 'Hold and Think',
    subtitle: 'Breath holds with cognitive tasks during the hold.',
    category: 'breathwork',
    mode: 'challenge',
    duration: 100,
    signals: ['breath', 'mind', 'pressure'],
    evidence: 'moderate',
    dynamicCognitive: true,
    cognitiveTier: 'tier2',
    steps: [
      { instruction: 'We\'re combining holds with thinking. Breathe normally.', duration: 8, type: 'prompt' },
      { instruction: 'Deep breath in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Hold.', duration: 5, type: 'pressure-hold' },
      { instruction: null, duration: 5, type: 'cognitive-slot' },
      { instruction: 'Release. Slow exhale.', duration: 8, type: 'breathe-out' },
      { instruction: 'Normal breath. Reset.', duration: 6, type: 'prompt' },
      { instruction: 'Deep breath in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Hold longer.', duration: 8, type: 'pressure-hold' },
      { instruction: null, duration: 5, type: 'cognitive-slot' },
      { instruction: 'Release. You held composure under double load.', duration: 8, type: 'breathe-out' }
    ]
  },
  {
    id: 'challenge-extended-progressive',
    title: 'Progressive Holds',
    subtitle: 'Three holds: building up, then easing back.',
    category: 'breathwork',
    mode: 'challenge',
    duration: 110,
    signals: ['breath', 'body', 'pressure'],
    evidence: 'moderate',
    steps: [
      { instruction: 'Three holds. They\'ll get harder, then ease back.', duration: 6, type: 'prompt' },
      { instruction: 'Deep breath in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Hold — 10 seconds. Comfortable zone.', duration: 10, type: 'pressure-hold' },
      { instruction: 'Release. Slow exhale.', duration: 8, type: 'breathe-out' },
      { instruction: 'Normal breathing. Easy.', duration: 8, type: 'prompt' },
      { instruction: 'Deep breath in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Hold — 15 seconds. This is the peak. Stay soft.', duration: 15, type: 'pressure-hold' },
      { instruction: 'Release. Long exhale. Longest you can.', duration: 10, type: 'breathe-out' },
      { instruction: 'Normal breathing. The hardest part is done.', duration: 8, type: 'prompt' },
      { instruction: 'Deep breath in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Hold — 12 seconds. Easier now. You know you can.', duration: 12, type: 'pressure-hold' },
      { instruction: 'Release. Done. Three holds. You stayed steady through all of them.', duration: 8, type: 'breathe-out' }
    ]
  },
  {
    id: 'challenge-pressure-cap',
    title: 'Pressure Capstone',
    subtitle: 'Holds + cognitive + timer. Everything from Phase 2.',
    category: 'breathwork',
    mode: 'challenge',
    duration: 120,
    signals: ['breath', 'mind', 'pressure'],
    evidence: 'moderate',
    dynamicCognitive: true,
    cognitiveTier: 'tier2',
    steps: [
      { instruction: 'Phase 2 capstone. Holds, thinking, timer. No disruptions yet.', duration: 6, type: 'prompt' },
      { instruction: 'Breathe in.', duration: 4, type: 'breathe-in' },
      { instruction: 'Hold.', duration: 8, type: 'pressure-hold' },
      { instruction: null, duration: 5, type: 'cognitive-slot' },
      { instruction: 'Exhale slowly.', duration: 6, type: 'breathe-out' },
      { instruction: 'Breathe in.', duration: 4, type: 'breathe-in' },
      { instruction: null, duration: 5, type: 'cognitive-slot' },
      { instruction: 'Exhale.', duration: 6, type: 'breathe-out' },
      { instruction: 'Hold.', duration: 10, type: 'pressure-hold' },
      { instruction: 'Release. Exhale slowly.', duration: 8, type: 'breathe-out' },
      { instruction: 'Breathe in.', duration: 4, type: 'breathe-in' },
      { instruction: null, duration: 5, type: 'cognitive-slot' },
      { instruction: 'Exhale. You combined everything. That\'s real skill.', duration: 8, type: 'breathe-out' },
      { instruction: 'Continue on your own.', duration: null, type: 'repeat' }
    ]
  },

  // --- Recovery Phase Extensions ---
  {
    id: 'challenge-disruption-double',
    title: 'Stay With It (2 Resets)',
    subtitle: 'Two disruptions. Recover each time.',
    category: 'mind',
    mode: 'challenge',
    duration: 100,
    signals: ['mind', 'breath', 'pressure'],
    evidence: 'moderate',
    dynamicDisruptions: true,
    disruptionCount: 2,
    steps: [
      { instruction: 'Slow breathing. 4 in, 6 out. Two interruptions coming. Find your breath each time.', duration: 8, type: 'prompt' },
      { instruction: 'Breathe in.', duration: 4, type: 'breathe-in' },
      { instruction: 'Exhale slowly.', duration: 6, type: 'breathe-out' },
      { instruction: 'Breathe in.', duration: 4, type: 'breathe-in' },
      { instruction: 'Exhale slowly.', duration: 6, type: 'breathe-out' },
      { instruction: null, duration: 0, type: 'disruption-slot' },
      { instruction: 'Find your breath. Slow exhale.', duration: 6, type: 'breathe-out' },
      { instruction: 'Breathe in.', duration: 4, type: 'breathe-in' },
      { instruction: 'Exhale.', duration: 6, type: 'breathe-out' },
      { instruction: 'Breathe in.', duration: 4, type: 'breathe-in' },
      { instruction: 'Exhale.', duration: 6, type: 'breathe-out' },
      { instruction: null, duration: 0, type: 'disruption-slot' },
      { instruction: 'Back to breathing. In.', duration: 4, type: 'breathe-in' },
      { instruction: 'Slow out. You recovered both times.', duration: 6, type: 'breathe-out' },
      { instruction: 'Continue on your own.', duration: null, type: 'repeat' }
    ]
  },
  {
    id: 'challenge-disruption-cognitive',
    title: 'Reset and Think',
    subtitle: 'A disruption followed by a cognitive task. Double recovery.',
    category: 'mind',
    mode: 'challenge',
    duration: 100,
    signals: ['mind', 'breath', 'pressure'],
    evidence: 'moderate',
    dynamicDisruptions: true,
    disruptionCount: 2,
    dynamicCognitive: true,
    cognitiveTier: 'tier2',
    steps: [
      { instruction: 'Breathing steady. Disruptions and thinking coming. Recover and refocus.', duration: 8, type: 'prompt' },
      { instruction: 'Breathe in.', duration: 4, type: 'breathe-in' },
      { instruction: 'Exhale slowly.', duration: 6, type: 'breathe-out' },
      { instruction: 'Breathe in.', duration: 4, type: 'breathe-in' },
      { instruction: null, duration: 0, type: 'disruption-slot' },
      { instruction: 'Find the breath. Exhale.', duration: 6, type: 'breathe-out' },
      { instruction: 'Breathe in.', duration: 4, type: 'breathe-in' },
      { instruction: null, duration: 5, type: 'cognitive-slot' },
      { instruction: 'Exhale. You recovered AND thought clearly.', duration: 6, type: 'breathe-out' },
      { instruction: 'Breathe in.', duration: 4, type: 'breathe-in' },
      { instruction: 'Exhale.', duration: 6, type: 'breathe-out' },
      { instruction: null, duration: 0, type: 'disruption-slot' },
      { instruction: 'Back to breathing. In.', duration: 4, type: 'breathe-in' },
      { instruction: null, duration: 5, type: 'cognitive-slot' },
      { instruction: 'Exhale. Disruption then cognition. You handled both.', duration: 6, type: 'breathe-out' }
    ]
  },
  {
    id: 'challenge-disruption-triple',
    title: 'Stay With It (3 Resets)',
    subtitle: 'Three disruptions. Closer together. Keep finding your breath.',
    category: 'mind',
    mode: 'challenge',
    duration: 110,
    signals: ['mind', 'breath', 'pressure'],
    evidence: 'moderate',
    dynamicDisruptions: true,
    disruptionCount: 3,
    steps: [
      { instruction: 'Three interruptions this time. Closer together. Your only job: find your breath.', duration: 8, type: 'prompt' },
      { instruction: 'Breathe in.', duration: 4, type: 'breathe-in' },
      { instruction: 'Exhale slowly.', duration: 6, type: 'breathe-out' },
      { instruction: null, duration: 0, type: 'disruption-slot' },
      { instruction: 'Find your breath. In.', duration: 4, type: 'breathe-in' },
      { instruction: 'Exhale.', duration: 6, type: 'breathe-out' },
      { instruction: 'Breathe in.', duration: 4, type: 'breathe-in' },
      { instruction: null, duration: 0, type: 'disruption-slot' },
      { instruction: 'Back to breathing. Exhale slowly.', duration: 6, type: 'breathe-out' },
      { instruction: 'Breathe in.', duration: 4, type: 'breathe-in' },
      { instruction: 'Exhale.', duration: 6, type: 'breathe-out' },
      { instruction: null, duration: 0, type: 'disruption-slot' },
      { instruction: 'Last one. Find your rhythm. In.', duration: 4, type: 'breathe-in' },
      { instruction: 'Slow exhale. Three recoveries. Every single time.', duration: 8, type: 'breathe-out' },
      { instruction: 'Continue breathing. The skill is the comeback.', duration: null, type: 'repeat' }
    ]
  },
  {
    id: 'challenge-pressure-disruption',
    title: 'Holds Under Fire',
    subtitle: 'Breath holds with disruptions between them.',
    category: 'breathwork',
    mode: 'challenge',
    duration: 120,
    signals: ['breath', 'body', 'mind', 'pressure'],
    evidence: 'moderate',
    dynamicDisruptions: true,
    disruptionCount: 2,
    steps: [
      { instruction: 'Holds and disruptions together. The hardest combo before the full stack.', duration: 6, type: 'prompt' },
      { instruction: 'Deep breath in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Hold. Stay relaxed.', duration: 12, type: 'pressure-hold' },
      { instruction: 'Release. Slow exhale.', duration: 8, type: 'breathe-out' },
      { instruction: null, duration: 0, type: 'disruption-slot' },
      { instruction: 'Find the breath. In.', duration: 4, type: 'breathe-in' },
      { instruction: 'Exhale. Reset complete.', duration: 6, type: 'breathe-out' },
      { instruction: 'Deep breath in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Hold. Longer. You know it passes.', duration: 15, type: 'pressure-hold' },
      { instruction: 'Release. Long exhale.', duration: 8, type: 'breathe-out' },
      { instruction: null, duration: 0, type: 'disruption-slot' },
      { instruction: 'Find it again. In.', duration: 4, type: 'breathe-in' },
      { instruction: 'Exhale. Pressure + disruption. You stayed steady through both.', duration: 8, type: 'breathe-out' }
    ]
  },

  // --- Transfer Phase Extensions ---
  {
    id: 'challenge-scenario-gentle',
    title: 'Imagine and Breathe',
    subtitle: 'A mild stressor. Just breathe through it.',
    category: 'mind',
    mode: 'challenge',
    duration: 100,
    signals: ['mind', 'pressure'],
    evidence: 'moderate',
    steps: [
      { instruction: 'Think of something mildly stressful coming up. A meeting. An errand. Nothing huge.', duration: 10, type: 'prompt' },
      { instruction: 'Notice what happens in your body. Even small things.', duration: 8, type: 'prompt' },
      { instruction: 'Breathe in slowly.', duration: 5, type: 'breathe-in' },
      { instruction: 'Exhale. The situation is in your head. Your body is here.', duration: 8, type: 'breathe-out' },
      { instruction: 'Breathe in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Exhale. Let the scenario float there. Don\'t solve it. Just be with it.', duration: 8, type: 'breathe-out' },
      { instruction: 'Breathe in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Exhale. You can think about something stressful and still be calm. That\'s the skill.', duration: 8, type: 'breathe-out' },
      { instruction: 'Continue breathing with the scenario in mind.', duration: null, type: 'repeat' }
    ]
  },
  {
    id: 'challenge-scenario-breathing',
    title: 'Scenario + Protocol',
    subtitle: 'Visualize stress while following a structured breathing pattern.',
    category: 'mind',
    mode: 'challenge',
    duration: 110,
    signals: ['mind', 'breath', 'pressure'],
    evidence: 'moderate',
    steps: [
      { instruction: 'Pick a moderately stressful situation. Something you\'d rate 5/10.', duration: 10, type: 'prompt' },
      { instruction: 'Hold it in mind. Now we add structured breathing: 4 in, 6 out.', duration: 8, type: 'prompt' },
      { instruction: 'Breathe in for 4.', duration: 4, type: 'breathe-in' },
      { instruction: 'Exhale for 6. The scenario is still there.', duration: 6, type: 'breathe-out' },
      { instruction: 'In for 4. Keep the image in your mind.', duration: 4, type: 'breathe-in' },
      { instruction: 'Out for 6. You\'re in the situation. And you\'re breathing.', duration: 6, type: 'breathe-out' },
      { instruction: 'In for 4.', duration: 4, type: 'breathe-in' },
      { instruction: 'Out for 6. The protocol works even when the stress is real.', duration: 6, type: 'breathe-out' },
      { instruction: 'Continue. 4 in, 6 out. Scenario stays. Breathing stays.', duration: null, type: 'repeat' }
    ]
  },
  {
    id: 'challenge-scenario-disruption',
    title: 'Scenario Under Fire',
    subtitle: 'Visualize a real situation while handling disruptions.',
    category: 'mind',
    mode: 'challenge',
    duration: 120,
    signals: ['mind', 'body', 'pressure'],
    evidence: 'moderate',
    dynamicDisruptions: true,
    disruptionCount: 2,
    steps: [
      { instruction: 'Think of a pressure situation. Something that matters to you. Hold it.', duration: 10, type: 'prompt' },
      { instruction: 'Feel the tension. Where is it?', duration: 6, type: 'prompt' },
      { instruction: 'Breathe in. You\'re here, not there.', duration: 5, type: 'breathe-in' },
      { instruction: 'Exhale. Both are true. Pressure and steadiness.', duration: 8, type: 'breathe-out' },
      { instruction: null, duration: 0, type: 'disruption-slot' },
      { instruction: 'Back to the scenario. Breathe in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Exhale. You got knocked off and came back. That\'s the real skill.', duration: 8, type: 'breathe-out' },
      { instruction: 'Breathe in. The situation hasn\'t changed.', duration: 5, type: 'breathe-in' },
      { instruction: 'Exhale. But you have.', duration: 8, type: 'breathe-out' },
      { instruction: null, duration: 0, type: 'disruption-slot' },
      { instruction: 'Find the breath again. In.', duration: 5, type: 'breathe-in' },
      { instruction: 'Out. Disruption during visualization. Hardest version. You did it.', duration: 8, type: 'breathe-out' }
    ]
  },
  {
    id: 'challenge-scenario-full',
    title: 'Steady Under Fire (Full)',
    subtitle: 'Your worst-case scenario. Full intensity. All skills active.',
    category: 'mind',
    mode: 'challenge',
    duration: 130,
    signals: ['mind', 'body', 'pressure'],
    evidence: 'moderate',
    dynamicDisruptions: true,
    disruptionCount: 3,
    dynamicCognitive: true,
    cognitiveTier: 'tier3',
    steps: [
      { instruction: 'Think of the hardest version. The call. The stage. The confrontation. The match point. Hold it.', duration: 10, type: 'prompt' },
      { instruction: 'Feel everything. Don\'t resist. Let the arousal come.', duration: 8, type: 'prompt' },
      { instruction: 'Now breathe. Slow inhale.', duration: 5, type: 'breathe-in' },
      { instruction: 'Long exhale. The situation is real. Your breathing is real too.', duration: 8, type: 'breathe-out' },
      { instruction: null, duration: 0, type: 'disruption-slot' },
      { instruction: 'Back. Breathe in.', duration: 5, type: 'breathe-in' },
      { instruction: null, duration: 6, type: 'cognitive-slot' },
      { instruction: 'Exhale. Under fire and still thinking.', duration: 8, type: 'breathe-out' },
      { instruction: 'Breathe in.', duration: 5, type: 'breathe-in' },
      { instruction: null, duration: 0, type: 'disruption-slot' },
      { instruction: 'Find the breath. Exhale slowly.', duration: 8, type: 'breathe-out' },
      { instruction: 'Breathe in. The pressure is real. Your steadiness is real too.', duration: 5, type: 'breathe-in' },
      { instruction: null, duration: 0, type: 'disruption-slot' },
      { instruction: 'One last recovery. Exhale.', duration: 8, type: 'breathe-out' },
      { instruction: 'You stayed steady under the worst version. Remember this.', duration: 8, type: 'prompt' }
    ]
  },
  {
    id: 'challenge-completion',
    title: 'Day 28: You Made It',
    subtitle: 'A short practice and a moment to look back at what you\'ve built.',
    category: 'mind',
    mode: 'challenge',
    duration: 90,
    signals: ['mind', 'body', 'breath', 'pressure'],
    evidence: 'moderate',
    steps: [
      { instruction: '28 days. You showed up. Let\'s close with what you\'ve learned.', duration: 8, type: 'prompt' },
      { instruction: 'Breathe in. Slow.', duration: 5, type: 'breathe-in' },
      { instruction: 'Exhale. You can regulate under pressure now.', duration: 8, type: 'breathe-out' },
      { instruction: 'Breathe in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Exhale. You can recover from disruption.', duration: 8, type: 'breathe-out' },
      { instruction: 'Breathe in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Exhale. You can stay steady when it matters.', duration: 8, type: 'breathe-out' },
      { instruction: 'Think about where you were 28 days ago. And where you are now.', duration: 10, type: 'prompt' },
      { instruction: 'One last breath. In.', duration: 5, type: 'breathe-in' },
      { instruction: 'Out. This isn\'t the end. This is the baseline.', duration: 8, type: 'breathe-out' },
      { instruction: 'Level 1 complete.', duration: 5, type: 'prompt' }
    ]
  },

  // ====================================================================
  // ORIGINAL NON-CHALLENGE EXERCISES (below)
  // ====================================================================

  {
    id: 'pre-event-protocol',
    title: 'Get Ready',
    subtitle: 'Steady yourself before something stressful.',
    category: 'quick',
    mode: 'prepare',
    duration: 60,
    signals: ['breath', 'pressure'],
    evidence: 'moderate',
    steps: [
      { instruction: 'Take a slow breath in through your nose.', duration: 5, type: 'breathe-in' },
      { instruction: 'Long exhale through your mouth. Let your shoulders drop.', duration: 8, type: 'breathe-out' },
      { instruction: 'Again. Slow breath in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Long exhale. Feel your feet on the ground.', duration: 8, type: 'breathe-out' },
      { instruction: 'One more. Breathe in.', duration: 5, type: 'breathe-in' },
      { instruction: 'Slow exhale. You\'re here.', duration: 8, type: 'breathe-out' },
      { instruction: 'Set your frame: I don\'t need to fix anything. I\'m just present.', duration: 10, type: 'prompt' },
      { instruction: 'What\'s your one job? Listen. Stay steady. Smooth tempo. Pick one.', duration: 8, type: 'prompt' },
      { instruction: 'You\'re ready. Go.', duration: 3, type: 'timed' }
    ]
  }
];

export const challengeDayMap = {
  // Phase 1: Foundation (Days 1-7) — single-variable stress
  1: 'challenge-countdown',
  2: 'challenge-cognitive',
  3: 'challenge-countdown',        // consolidation repeat
  4: 'challenge-cognitive',         // consolidation repeat
  5: 'challenge-countdown-long',    // longer duration
  6: 'challenge-cognitive-medium',  // harder cognitive tasks
  7: 'challenge-foundation-cap',    // combined timer + easy cognitive

  // Phase 2: Pressure (Days 8-14) — increasing intensity
  8: 'challenge-extended',          // first breath holds (10s)
  9: 'challenge-extended',          // repeat with coaching refinement
  10: 'challenge-extended-long',    // longer holds (15s)
  11: 'challenge-cognitive-hard',   // difficult cognitive under breathing
  12: 'challenge-pressure-cognitive', // hold + cognitive during hold
  13: 'challenge-extended-progressive', // 3 progressive holds
  14: 'challenge-pressure-cap',     // all pressure skills combined

  // Phase 3: Recovery (Days 15-21) — disruption + recovery
  15: 'challenge-disruption',       // 1 disruption
  16: 'challenge-disruption',       // 1 disruption, different content
  17: 'challenge-disruption-double', // 2 disruptions
  18: 'challenge-disruption-cognitive', // disruption + cognitive recovery
  19: 'challenge-disruption-triple', // 3 disruptions
  20: 'challenge-pressure-disruption', // holds + disruptions
  21: 'challenge-stack',            // full stack capstone

  // Phase 4: Transfer (Days 22-28) — real-world application
  22: 'challenge-scenario-gentle',  // mild visualization
  23: 'challenge-scenario-breathing', // visualization + breathing protocol
  24: 'challenge-scenario',         // moderate intensity scenario
  25: 'challenge-scenario-disruption', // visualization + disruption
  26: 'pre-event-protocol',         // practical pre-event breathing
  27: 'challenge-scenario-full',    // peak intensity scenario
  28: 'challenge-completion',       // capstone + reflection prompt
};

export const intentionCategories = [
  {
    id: 'difficult-conversations',
    label: 'Difficult Conversations',
    description: 'Staying calm during confrontations or hard discussions.'
  },
  {
    id: 'performance-competition',
    label: 'Performance & Competition',
    description: 'Handling pressure in sports, gaming, or competitive moments.'
  },
  {
    id: 'work-pressure',
    label: 'Work Pressure',
    description: 'Managing stress from deadlines, meetings, or high-stakes work.'
  },
  {
    id: 'social-situations',
    label: 'Social Situations',
    description: 'Staying grounded in groups, networking, or social anxiety.'
  },
  {
    id: 'public-speaking',
    label: 'Public Speaking',
    description: 'Controlling nerves before presentations or speaking publicly.'
  },
  {
    id: 'gaming-esports',
    label: 'Gaming & Esports',
    description: 'Maintaining composure during intense gaming sessions.'
  },
  {
    id: 'family-conflict',
    label: 'Family Conflict',
    description: 'Staying regulated during family disagreements or tension.'
  },
  {
    id: 'confrontation',
    label: 'Confrontation',
    description: 'Managing your nervous system during direct conflict.'
  },
  {
    id: 'general-resilience',
    label: 'General Resilience',
    description: 'Building overall stress tolerance and nervous system strength.'
  }
];

export const signalDefinitions = {
  mind: {
    label: 'Mind Speed',
    levels: ['Calm', 'Busy', 'Racing'],
    icon: 'concentric-circles'
  },
  body: {
    label: 'Body Tension',
    levels: ['Loose', 'Tight', 'Locked'],
    icon: 'parallel-bars'
  },
  breath: {
    label: 'Breathing',
    levels: ['Deep', 'Shallow', 'Stuck'],
    icon: 'sine-wave'
  },
  pressure: {
    label: 'Internal Pressure',
    levels: ['Settled', 'Uneasy', 'Intense'],
    icon: 'double-chevrons'
  }
};

export const challengePhases = [
  {
    name: 'Foundation',
    description: 'Learn to regulate under mild stress',
    days: [1, 2, 3, 4, 5, 6, 7]
  },
  {
    name: 'Pressure',
    description: 'Build your skill under increasing load',
    days: [8, 9, 10, 11, 12, 13, 14]
  },
  {
    name: 'Recovery',
    description: 'Get knocked off balance and find your way back',
    days: [15, 16, 17, 18, 19, 20, 21]
  },
  {
    name: 'Transfer',
    description: 'Take it to the real world',
    days: [22, 23, 24, 25, 26, 27, 28]
  }
];

// ============================================================================
// COGNITIVE TASK POOLS
// Organized by tier. Player draws randomly from the appropriate tier.
// ============================================================================

export const cognitiveTasks = {
  // Foundation — Days 1-7, Level 1
  tier1: [
    { instruction: 'Count backwards from 20 by 2s.', duration: 4 },
    { instruction: 'Name 3 fruits.', duration: 4 },
    { instruction: 'What month comes after October?', duration: 4 },
    { instruction: 'Spell the word "calm" backwards.', duration: 4 },
    { instruction: 'What\'s 7 + 8?', duration: 4 },
    { instruction: 'Name 3 colors you can see right now.', duration: 4 },
    { instruction: 'What day of the week was yesterday?', duration: 4 },
    { instruction: 'Think of 2 words that start with S.', duration: 4 },
    { instruction: 'What\'s 12 - 5?', duration: 4 },
    { instruction: 'Name something you drank today.', duration: 4 },
    { instruction: 'Count backwards from 10 to 1.', duration: 4 },
    { instruction: 'What\'s 6 + 9?', duration: 4 },
    { instruction: 'Name 2 animals that fly.', duration: 4 },
    { instruction: 'Spell the word "step" backwards.', duration: 4 },
    { instruction: 'What comes after Wednesday?', duration: 4 },
  ],

  // Pressure — Days 8-14, Level 1
  tier2: [
    { instruction: 'Count backwards from 50 by 3s.', duration: 5 },
    { instruction: 'Name 5 animals that aren\'t pets.', duration: 5 },
    { instruction: 'What day is it 4 days from now?', duration: 5 },
    { instruction: 'Think of 3 words that start with R.', duration: 5 },
    { instruction: 'What\'s 23 - 7?', duration: 5 },
    { instruction: 'Name 4 countries in Europe.', duration: 5 },
    { instruction: 'What\'s 8 × 3?', duration: 5 },
    { instruction: 'Think of a word that rhymes with "light."', duration: 5 },
    { instruction: 'Name 3 things in your pocket or nearby.', duration: 5 },
    { instruction: 'Count backwards from 30 by 4s.', duration: 5 },
    { instruction: 'What month is 3 months from now?', duration: 5 },
    { instruction: 'Name 3 foods that are green.', duration: 5 },
    { instruction: 'What\'s 15 + 18?', duration: 5 },
    { instruction: 'Think of 3 words that end with "-tion."', duration: 5 },
    { instruction: 'Spell the word "steady" backwards.', duration: 5 },
  ],

  // Recovery/Transfer — Days 15-28, Level 1
  tier3: [
    { instruction: 'Count backwards from 100 by 7s.', duration: 6 },
    { instruction: 'Name a country for each letter: A, B, C.', duration: 6 },
    { instruction: 'What\'s 8 × 7?', duration: 5 },
    { instruction: 'Think of a word that rhymes with "pressure."', duration: 5 },
    { instruction: 'Spell a 6-letter word backwards.', duration: 6 },
    { instruction: 'Name 3 rivers on different continents.', duration: 6 },
    { instruction: 'What\'s 64 ÷ 8?', duration: 5 },
    { instruction: 'Think of 4 words that start with the same letter.', duration: 6 },
    { instruction: 'Name the months of the year backwards from December.', duration: 6 },
    { instruction: 'What\'s 17 + 26?', duration: 5 },
    { instruction: 'Name 3 capital cities.', duration: 6 },
    { instruction: 'Count backwards from 80 by 6s.', duration: 6 },
    { instruction: 'Think of 5 animals. Go.', duration: 5 },
    { instruction: 'What\'s 13 × 4?', duration: 5 },
    { instruction: 'Name something for each sense: see, hear, feel.', duration: 6 },
  ]
};

// ============================================================================
// DISRUPTION CONTENT POOL
// Player draws randomly during disruption windows.
// ============================================================================

export const disruptionPool = [
  { instruction: 'RESET — What color is the nearest wall?', duration: 3 },
  { instruction: 'RESET — Clench your fists tight. Now release.', duration: 4 },
  { instruction: 'RESET — Hold your breath for 3 seconds.', duration: 3 },
  { instruction: 'RESET — Open your eyes wide. Now soften them.', duration: 4 },
  { instruction: 'RESET — Name the last thing you ate.', duration: 3 },
  { instruction: 'RESET — Press your feet hard into the floor. Release.', duration: 4 },
  { instruction: 'RESET — What sound can you hear right now?', duration: 3 },
  { instruction: 'RESET — Shrug your shoulders to your ears. Drop them.', duration: 4 },
  { instruction: 'RESET — Take one sharp breath in. Now slow it down.', duration: 4 },
  { instruction: 'RESET — Wiggle your fingers. Now stop. Be still.', duration: 4 },
  { instruction: 'RESET — What\'s the temperature of your hands?', duration: 3 },
  { instruction: 'RESET — Squeeze your jaw. Release. Let it hang.', duration: 4 },
  { instruction: 'RESET — Tap your collarbone twice. Back to breathing.', duration: 3 },
  { instruction: 'RESET — Blink 5 times fast. Now slow.', duration: 3 },
  { instruction: 'RESET — Name 2 things you can see. Go.', duration: 3 },
];

// ============================================================================
// RANDOMIZATION FUNCTIONS
// ============================================================================

// Track recently used items to avoid repeats within a session
const _recentCognitive = { tier1: [], tier2: [], tier3: [] };
const _recentDisruptions = [];

/**
 * Get a random cognitive task from the specified tier
 * Avoids repeating the last 5 used tasks from that tier
 * @param {string} tier - 'tier1', 'tier2', or 'tier3'
 * @returns {Object} { instruction, duration, type: 'cognitive' }
 */
export function getRandomCognitiveTask(tier) {
  const pool = cognitiveTasks[tier] || cognitiveTasks.tier1;
  const recent = _recentCognitive[tier] || [];

  // Filter out recently used
  let available = pool.filter((_, i) => !recent.includes(i));
  if (available.length === 0) {
    // Reset if all used
    _recentCognitive[tier] = [];
    available = pool;
  }

  const idx = Math.floor(Math.random() * available.length);
  const task = available[idx];

  // Track the original index
  const originalIdx = pool.indexOf(task);
  _recentCognitive[tier].push(originalIdx);
  if (_recentCognitive[tier].length > 5) {
    _recentCognitive[tier].shift();
  }

  return { ...task, type: 'cognitive' };
}

/**
 * Get a random disruption from the pool
 * Avoids repeating the last 4 used disruptions
 * @returns {Object} { instruction, duration, type: 'disruption' }
 */
export function getRandomDisruption() {
  let available = disruptionPool.filter((_, i) => !_recentDisruptions.includes(i));
  if (available.length === 0) {
    _recentDisruptions.length = 0;
    available = disruptionPool;
  }

  const idx = Math.floor(Math.random() * available.length);
  const disruption = available[idx];

  const originalIdx = disruptionPool.indexOf(disruption);
  _recentDisruptions.push(originalIdx);
  if (_recentDisruptions.length > 4) {
    _recentDisruptions.shift();
  }

  return { ...disruption, type: 'disruption' };
}

/**
 * Get the cognitive tier for a given challenge day
 * @param {number} day - Challenge day (1-28)
 * @returns {string} Tier name
 */
export function getCognitiveTierForDay(day) {
  if (day <= 7) return 'tier1';
  if (day <= 14) return 'tier2';
  return 'tier3';
}

/**
 * Get the number of disruption windows for a given challenge day
 * @param {number} day - Challenge day (1-28)
 * @returns {number} Number of disruptions (0 for phases 1-2)
 */
export function getDisruptionCountForDay(day) {
  if (day <= 14) return 0;   // Foundation + Pressure: no disruptions
  if (day === 15 || day === 16) return 1;
  if (day === 17 || day === 18) return 2;
  if (day >= 19 && day <= 21) return 3;
  if (day >= 22 && day <= 24) return 2;  // Transfer: moderate disruptions
  if (day >= 25 && day <= 26) return 3;
  if (day >= 27) return 3;
  return 0;
}
