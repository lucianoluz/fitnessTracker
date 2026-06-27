// Predefined workout plans, one set per equipment mode. Each plan is an ordered
// list of sessions; each session is an ordered list of existing exercise ids
// (see exercises.js). The "Today's Session" screen cycles through a plan's
// sessions in order, driven by history (see storage.js session markers), so the
// rotation is calendar-independent — a missed or skipped day never breaks it.
//
// Every exercise id below is a real id from the EXERCISES catalog.
const PLANS = [
  // --- Dumbbell mode ---
  {
    id: 'db-main',
    equipment: 'dumbbell',
    name: 'Main plan',
    sessions: [
      {
        id: 'db-main-pull',
        name: 'Pull Day',
        exercises: [
          'plank', 'dead-bug', 'single-arm-row', 'shrug',
          'superman', 'weighted-crunch', 'suitcase-carry', 'standing-twist',
        ],
      },
      {
        id: 'db-main-push',
        name: 'Push Day',
        exercises: [
          'goblet-squat', 'glute-bridge', 'hip-hinge', 'db-bench-press',
          'overhead-press', 'lateral-raise', 'oh-triceps-ext', 'calf-raise',
        ],
      },
    ],
  },
  {
    id: 'db-rush',
    equipment: 'dumbbell',
    name: 'Rush plan',
    sessions: [
      {
        id: 'db-rush-push',
        name: 'Rush 1 – Push',
        exercises: ['db-bench-press', 'overhead-press', 'lateral-raise', 'oh-triceps-ext'],
      },
      {
        id: 'db-rush-pull',
        name: 'Rush 2 – Pull',
        exercises: ['single-arm-row', 'shrug', 'superman', 'biceps-curl'],
      },
      {
        id: 'db-rush-legs',
        name: 'Rush 3 – Legs',
        exercises: ['goblet-squat', 'hip-hinge', 'glute-bridge', 'calf-raise'],
      },
      {
        id: 'db-rush-core',
        name: 'Rush 4 – Core',
        exercises: ['plank', 'dead-bug', 'weighted-crunch', 'standing-twist', 'suitcase-carry'],
      },
    ],
  },

  // --- Bodyweight mode ---
  {
    id: 'bw-home',
    equipment: 'bodyweight',
    name: 'Home plan',
    sessions: [
      {
        id: 'bw-home-pull',
        name: 'Pull Day',
        exercises: [
          'pull-up', 'plank', 'dead-bug', 'superman',
          'crunch', 'side-plank-hip-dip', 'russian-twist',
        ],
      },
      {
        id: 'bw-home-push',
        name: 'Push Day',
        exercises: [
          'bodyweight-squat', 'single-leg-glute-bridge', 'single-leg-rdl', 'push-up',
          'pike-push-up', 'prone-y-raise', 'chair-dips', 'bodyweight-calf-raise',
        ],
      },
    ],
  },
];

// All plans for an equipment mode, in catalog order.
function plansForEquipment(equipment) {
  return PLANS.filter((p) => p.equipment === equipment);
}

function planById(id) {
  return PLANS.find((p) => p.id === id) || null;
}

// Find a session within a plan, plus its index in the rotation.
function sessionInPlan(plan, sessionId) {
  if (!plan) return { session: null, index: -1 };
  const index = plan.sessions.findIndex((s) => s.id === sessionId);
  return { session: index >= 0 ? plan.sessions[index] : null, index };
}
