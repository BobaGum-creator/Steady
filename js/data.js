/**
 * Exercise Data Module for Steady
 * Defines all exercises with guidance steps, evidence levels, and metadata
 */

export const categories = [
  { id: 'breathwork', label: 'Breathwork', icon: '🌬️' },
  { id: 'body', label: 'Body', icon: '💪' },
  { id: 'mind', label: 'Mind', icon: '🧠' },
  { id: 'quick', label: 'Quick Tools', icon: '⚡' }
];

export const exercises = [
  {
    id: 'physiological-sigh',
    title: 'Emergency Calm',
    subtitle: 'Fastest way to lower stress',
    category: 'breathwork',
    duration: 90,
    icon: '💨',
    description: 'The physiological sigh is the fastest way to calm your nervous system. A double inhale followed by a long exhale signals safety to your brain.',
    bestFor: ['acute-stress'],
    evidenceLevel: 'strong',
    steps: [
      {
        instruction: 'Quick double inhale through your nose: first breath in (1 second), then a quick sip of air (1 second)',
        duration: 2,
        type: 'breathe-in'
      },
      {
        instruction: 'Long slow exhale through your mouth (6 seconds)',
        duration: 6,
        type: 'breathe-out'
      },
      {
        instruction: 'Brief pause',
        duration: 1,
        type: 'hold'
      },
      {
        instruction: 'Repeat this cycle',
        duration: null,
        type: 'repeat'
      }
    ]
  },

  {
    id: 'resonant-breathing',
    title: '3-Minute Reset',
    subtitle: 'Calm your nervous system',
    category: 'breathwork',
    duration: 180,
    icon: '🌊',
    description: 'Breathing at 5.5 breaths per minute activates your parasympathetic nervous system, the "rest and digest" response. This is backed by decades of research.',
    bestFor: ['baseline', 'sleep'],
    evidenceLevel: 'strong',
    steps: [
      {
        instruction: 'Inhale slowly through your nose',
        duration: 5,
        type: 'breathe-in'
      },
      {
        instruction: 'Exhale slowly through your nose or mouth',
        duration: 6,
        type: 'breathe-out'
      },
      {
        instruction: 'Repeat this rhythm for 3 minutes',
        duration: null,
        type: 'repeat'
      }
    ]
  },

  {
    id: 'extended-exhale',
    title: 'Slow Down',
    subtitle: 'Activate your rest response',
    category: 'breathwork',
    duration: 120,
    icon: '🫁',
    description: 'Making your exhale longer than your inhale directly activates your rest response. This simple technique works within minutes.',
    bestFor: ['acute-stress', 'sleep'],
    evidenceLevel: 'moderate',
    steps: [
      {
        instruction: 'Inhale through your nose',
        duration: 4,
        type: 'breathe-in'
      },
      {
        instruction: 'Exhale slowly through your mouth',
        duration: 8,
        type: 'breathe-out'
      },
      {
        instruction: 'Repeat this pattern for 2 minutes',
        duration: null,
        type: 'repeat'
      }
    ]
  },

  {
    id: 'pmr-short',
    title: 'Body Tension Reset',
    subtitle: 'Release stored stress from muscles',
    category: 'body',
    duration: 240,
    icon: '🧘',
    description: 'Progressive muscle relaxation trains your body to recognize and release tension. By tensing and releasing muscle groups, you teach your nervous system the difference between stress and calm.',
    bestFor: ['body-tension', 'sleep'],
    evidenceLevel: 'strong',
    steps: [
      {
        instruction: 'Find a comfortable position. We\'ll tense and release 6 muscle groups, learning what tension and release feel like.',
        duration: 10,
        type: 'prompt'
      },
      {
        instruction: 'Make tight fists. Squeeze your hands and forearms hard.',
        duration: 5,
        type: 'timed'
      },
      {
        instruction: 'Release. Let your hands go completely limp. Notice the difference.',
        duration: 10,
        type: 'hold'
      },
      {
        instruction: 'Shrug your shoulders up to your ears. Hold tight.',
        duration: 5,
        type: 'timed'
      },
      {
        instruction: 'Drop them. Let the weight fall away.',
        duration: 10,
        type: 'hold'
      },
      {
        instruction: 'Scrunch your whole face tight—eyes, jaw, forehead.',
        duration: 5,
        type: 'timed'
      },
      {
        instruction: 'Release. Let your face go slack.',
        duration: 10,
        type: 'hold'
      },
      {
        instruction: 'Take a deep breath. Tighten your core and chest.',
        duration: 5,
        type: 'timed'
      },
      {
        instruction: 'Exhale and release everything.',
        duration: 10,
        type: 'hold'
      },
      {
        instruction: 'Press your feet into the floor. Tense your thighs and calves.',
        duration: 5,
        type: 'timed'
      },
      {
        instruction: 'Let go completely.',
        duration: 10,
        type: 'hold'
      },
      {
        instruction: 'Tense everything at once—fists, shoulders, face, core, legs.',
        duration: 5,
        type: 'timed'
      },
      {
        instruction: 'Release it all. Breathe normally.',
        duration: 10,
        type: 'hold'
      },
      {
        instruction: 'Sit quietly. Notice how your body feels now. Relaxed, heavier, warmer?',
        duration: 15,
        type: 'prompt'
      }
    ]
  },

  {
    id: 'grounding-54321',
    title: 'Stop the Spiral',
    subtitle: 'Get out of your head, into the room',
    category: 'mind',
    duration: 180,
    icon: '🌳',
    description: 'The 5-4-3-2-1 grounding technique brings you back to the present moment by engaging your senses. This interrupts rumination and anxiety spirals.',
    bestFor: ['acute-stress', 'rumination'],
    evidenceLevel: 'moderate',
    steps: [
      {
        instruction: 'Look around the room. We\'ll use your senses to come back to the present moment.',
        duration: 8,
        type: 'prompt'
      },
      {
        instruction: 'Name 5 things you can see. Look at each one carefully.',
        duration: 30,
        type: 'prompt'
      },
      {
        instruction: 'Name 4 things you can physically feel right now—the chair, your clothes, the air.',
        duration: 25,
        type: 'prompt'
      },
      {
        instruction: 'Name 3 things you can hear. Listen closely.',
        duration: 25,
        type: 'prompt'
      },
      {
        instruction: 'Name 2 things you can smell. If you can\'t, move closer to something.',
        duration: 20,
        type: 'prompt'
      },
      {
        instruction: 'Name 1 thing you can taste.',
        duration: 15,
        type: 'prompt'
      },
      {
        instruction: 'Take a slow breath. You are here. You are present.',
        duration: 15,
        type: 'hold'
      }
    ]
  },

  {
    id: 'name-the-story',
    title: 'Unhook from Thoughts',
    subtitle: 'Stop believing every thought',
    category: 'mind',
    duration: 120,
    icon: '📖',
    description: 'Your mind tells stories constantly—most of them aren\'t true. By naming the story, you create distance from it and regain choice.',
    bestFor: ['rumination'],
    evidenceLevel: 'moderate',
    steps: [
      {
        instruction: 'Notice what thought keeps looping in your head right now.',
        duration: 15,
        type: 'prompt'
      },
      {
        instruction: 'Give it a name. "The failure story." "The catastrophe story." "The not-enough story."',
        duration: 15,
        type: 'prompt'
      },
      {
        instruction: 'Say to yourself: "I notice I\'m having the [name] story again."',
        duration: 10,
        type: 'prompt'
      },
      {
        instruction: 'This is a thought. Not a fact. Not a prediction. Just a thought.',
        duration: 10,
        type: 'timed'
      },
      {
        instruction: 'You don\'t need to argue with it or fix it. Just notice it\'s there.',
        duration: 10,
        type: 'timed'
      },
      {
        instruction: 'Take a breath. You are not your thoughts.',
        duration: 10,
        type: 'timed'
      },
      {
        instruction: 'What actually matters to you right now? What\'s one small thing you can do?',
        duration: 20,
        type: 'prompt'
      }
    ]
  },

  {
    id: 'leaves-on-stream',
    title: 'Let Thoughts Pass',
    subtitle: 'Watch stress float away',
    category: 'mind',
    duration: 180,
    icon: '🍃',
    description: 'This mindfulness technique teaches you to observe thoughts without fighting them. Like leaves on a stream, thoughts come and go naturally.',
    bestFor: ['rumination', 'baseline'],
    evidenceLevel: 'moderate',
    steps: [
      {
        instruction: 'Close your eyes or soften your gaze.',
        duration: 8,
        type: 'prompt'
      },
      {
        instruction: 'Imagine you\'re sitting beside a slow-moving stream.',
        duration: 10,
        type: 'timed'
      },
      {
        instruction: 'Leaves are floating on the surface, drifting past you.',
        duration: 10,
        type: 'timed'
      },
      {
        instruction: 'When a thought comes—any thought—place it on a leaf.',
        duration: 10,
        type: 'prompt'
      },
      {
        instruction: 'Watch it float downstream. Don\'t push it. Don\'t hold it.',
        duration: 12,
        type: 'hold'
      },
      {
        instruction: 'Another thought comes. Place it on the next leaf. Just keep watching.',
        duration: 45,
        type: 'repeat'
      },
      {
        instruction: 'If you get pulled into a thought, that\'s normal. Just notice, and place it on the next leaf.',
        duration: 15,
        type: 'prompt'
      },
      {
        instruction: 'Keep watching. Thoughts come. Thoughts go. You\'re just the observer.',
        duration: 45,
        type: 'repeat'
      },
      {
        instruction: 'Take a slow breath. Open your eyes when ready.',
        duration: 15,
        type: 'prompt'
      }
    ]
  },

  {
    id: 'stress-journal',
    title: 'Quick Unload',
    subtitle: '60 seconds to clear your head',
    category: 'quick',
    duration: 60,
    icon: '📝',
    description: 'Writing down what\'s stressing you moves it from your mind to paper, freeing up mental energy. This quick exercise helps you identify what you can actually control.',
    bestFor: ['rumination', 'acute-stress'],
    evidenceLevel: 'moderate',
    steps: [
      {
        instruction: 'What is stressing me right now?',
        duration: null,
        type: 'prompt'
      },
      {
        instruction: 'What is actually in my control?',
        duration: null,
        type: 'prompt'
      },
      {
        instruction: 'One next step I can take:',
        duration: null,
        type: 'prompt'
      }
    ]
  },

  {
    id: 'orienting-response',
    title: 'Look Around',
    subtitle: 'Tell your brain you\'re safe',
    category: 'body',
    duration: 120,
    icon: '👀',
    description: 'When you actively scan your environment, your nervous system receives a signal: "The threat has passed, we\'re safe." This ancient mechanism works instantly.',
    bestFor: ['acute-stress', 'body-tension'],
    evidenceLevel: 'emerging',
    steps: [
      {
        instruction: 'Sit comfortably. Take one slow breath.',
        duration: 8,
        type: 'timed'
      },
      {
        instruction: 'Slowly look around the room.',
        duration: 10,
        type: 'timed'
      },
      {
        instruction: 'Let your eyes land on objects. Notice colors, shapes, and textures.',
        duration: 20,
        type: 'hold'
      },
      {
        instruction: 'Turn your head gently. Don\'t just move your eyes—move your whole head.',
        duration: 20,
        type: 'timed'
      },
      {
        instruction: 'Find something that feels neutral or pleasant to look at. Stay with it.',
        duration: 15,
        type: 'hold'
      },
      {
        instruction: 'Notice the light in the room. Notice textures and distances.',
        duration: 20,
        type: 'timed'
      },
      {
        instruction: 'Keep breathing slowly. Keep scanning gently.',
        duration: 20,
        type: 'hold'
      },
      {
        instruction: 'Take one more breath. You are here. You are safe.',
        duration: 10,
        type: 'timed'
      }
    ]
  },

  {
    id: 'pendulation',
    title: 'Tension and Ease',
    subtitle: 'Teach your body stress is temporary',
    category: 'body',
    duration: 150,
    icon: '⚖️',
    description: 'By shifting your attention between tension and comfort, you teach your nervous system that stress is temporary and changeable. This builds resilience.',
    bestFor: ['body-tension', 'baseline'],
    evidenceLevel: 'emerging',
    steps: [
      {
        instruction: 'Notice one area of tension in your body—jaw, chest, stomach, or shoulders.',
        duration: 10,
        type: 'prompt'
      },
      {
        instruction: 'Just notice that sensation. Don\'t try to change it.',
        duration: 10,
        type: 'hold'
      },
      {
        instruction: 'Now shift your attention to a comfortable area—hands, feet, or back.',
        duration: 15,
        type: 'timed'
      },
      {
        instruction: 'Stay with that comfortable feeling.',
        duration: 15,
        type: 'hold'
      },
      {
        instruction: 'Move back to the tension. Just notice it.',
        duration: 10,
        type: 'timed'
      },
      {
        instruction: 'Now back to the comfortable area.',
        duration: 15,
        type: 'hold'
      },
      {
        instruction: 'Again—briefly visit the tension.',
        duration: 10,
        type: 'timed'
      },
      {
        instruction: 'And return to ease.',
        duration: 15,
        type: 'hold'
      },
      {
        instruction: 'One more time. Notice the tension.',
        duration: 8,
        type: 'timed'
      },
      {
        instruction: 'And now the ease.',
        duration: 15,
        type: 'hold'
      },
      {
        instruction: 'Notice: your body can move between these states. Stress is not permanent.',
        duration: 15,
        type: 'prompt'
      }
    ]
  },

  {
    id: 'tremor-release',
    title: 'Shake It Off',
    subtitle: 'Release built-up tension through movement',
    category: 'body',
    duration: 120,
    icon: '🫨',
    description: 'Gentle shaking releases the tension your body holds after stress. This mimics a natural nervous system reset that animals use.',
    bestFor: ['body-tension', 'baseline'],
    evidenceLevel: 'emerging',
    steps: [
      {
        instruction: 'Stand or sit comfortably. Let your arms hang loose.',
        duration: 8,
        type: 'timed'
      },
      {
        instruction: 'Begin gently shaking your hands and arms. Keep it relaxed.',
        duration: 20,
        type: 'timed'
      },
      {
        instruction: 'Let the shaking spread to your shoulders.',
        duration: 15,
        type: 'timed'
      },
      {
        instruction: 'Allow your whole upper body to shake loosely.',
        duration: 15,
        type: 'timed'
      },
      {
        instruction: 'If standing, let your legs bounce gently too.',
        duration: 15,
        type: 'timed'
      },
      {
        instruction: 'Don\'t force it. Let the movement be easy and natural.',
        duration: 20,
        type: 'hold'
      },
      {
        instruction: 'Slow down gradually.',
        duration: 10,
        type: 'timed'
      },
      {
        instruction: 'Stop. Stand still. Notice what you feel.',
        duration: 15,
        type: 'prompt'
      }
    ]
  }
];

/**
 * Get a single exercise by ID
 * @param {string} id - The exercise ID
 * @returns {Object|null} The exercise object or null if not found
 */
export function getExercise(id) {
  return exercises.find(exercise => exercise.id === id) || null;
}

/**
 * Get all exercises in a specific category
 * @param {string} category - The category ID
 * @returns {Array} Array of exercises in that category
 */
export function getExercisesByCategory(category) {
  return exercises.filter(exercise => exercise.category === category);
}
