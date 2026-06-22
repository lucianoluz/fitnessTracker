// Static exercise catalog, transcribed from the build spec.
// `muscles` is an array so an exercise can appear under more than one muscle
// group. Muscle keys used by the body diagram:
//   core, back, shoulders, chest, triceps, biceps, legs, calves
// `weight` / `repsSets` are the current working defaults; once logging exists,
// the most recent log entry overrides "last used" at display time.
const EXERCISES = [
  // --- Core ---
  { id: 'plank',            name: 'Plank',                          muscles: ['core'],      weight: 'bodyweight',     repsSets: 'hold ~50 sec x 3',        cue: "Straight line, don't let hips sag" },
  { id: 'dead-bug',         name: 'Dead bug',                       muscles: ['core'],      weight: 'bodyweight',     repsSets: '15 each side x 3',        cue: 'Lower back stays flat on floor' },
  { id: 'weighted-crunch',  name: 'Weighted crunch',                muscles: ['core'],      weight: '5 kg',           repsSets: '12–15 x 3',               cue: 'Curl shoulders up, squeeze abs, lower slowly' },
  { id: 'standing-twist',   name: 'Standing twist',                 muscles: ['core'],      weight: '10 kg',          repsSets: '10 each side x 3',        cue: 'Start with left side, control the swing' },
  { id: 'suitcase-carry',   name: 'Suitcase carry',                 muscles: ['core'],      weight: '20 kg',          repsSets: '30 steps each side x 3',  cue: "Don't lean to the side" },
  { id: 'side-plank',       name: 'Side plank',                     muscles: ['core'],      weight: 'bodyweight',     repsSets: '30 sec each side',        cue: 'Optional extra' },

  // --- Back ---
  { id: 'single-arm-row',   name: 'Single-arm row',                 muscles: ['back'],      weight: '14 kg',          repsSets: '10 each arm x 3',         cue: 'Knee + hand on bench, pull to ribs' },
  { id: 'shrug',            name: 'Shrug',                          muscles: ['back'],      weight: '12 kg each hand', repsSets: '12 x 3',                 cue: 'Straight up and down, no rolling' },
  { id: 'superman',         name: 'Superman',                       muscles: ['back'],      weight: 'bodyweight',     repsSets: '10 x 3',                  cue: 'Lift chest, arms, legs together, hold 1 sec' },

  // --- Legs ---
  { id: 'goblet-squat',     name: 'Goblet squat',                   muscles: ['legs'],      weight: '16 kg',          repsSets: '10 x 3',                  cue: 'Hold at chest, chest tall' },
  { id: 'glute-bridge',     name: 'Glute bridge',                   muscles: ['legs'],      weight: '14 kg',          repsSets: '12 x 3',                  cue: 'Dumbbell on hips, drive up, squeeze' },
  { id: 'hip-hinge',        name: 'Hip hinge (Romanian deadlift)',  muscles: ['legs'],      weight: '8 kg each hand', repsSets: '10 x 3',                  cue: 'Hinge at hips, flat back, NOT round' },

  // --- Calves ---
  { id: 'calf-raise',       name: 'Calf raise',                     muscles: ['calves'],    weight: '20 kg',          repsSets: '15 x 3',                  cue: 'Slow up, slow down' },

  // --- Chest ---
  { id: 'db-bench-press',   name: 'Dumbbell bench press',           muscles: ['chest'],     weight: '10 kg',          repsSets: '10 x 3',                  cue: 'Lower to upper-arm-touches-floor depth' },

  // --- Shoulders ---
  { id: 'overhead-press',   name: 'Overhead press',                 muscles: ['shoulders'], weight: '6 kg each hand', repsSets: '10 x 3',                  cue: 'Press straight overhead' },
  { id: 'lateral-raise',    name: 'Lateral raise',                  muscles: ['shoulders'], weight: '4 kg',           repsSets: '12 x 3',                  cue: 'Slow, no swinging, light weight' },

  // --- Triceps ---
  { id: 'oh-triceps-ext',   name: 'Overhead triceps extension',     muscles: ['triceps'],   weight: '8 kg',           repsSets: '12 x 3',                  cue: "Elbows tucked in, don't flare" },

  // --- Biceps ---
  { id: 'biceps-curl',      name: 'Biceps curl',                    muscles: ['biceps'],    weight: '6–8 kg',         repsSets: '10 x 3',                  cue: 'Full range, no back swing' },
];

// Human-readable labels for each muscle key (used in the panel header).
const MUSCLE_LABELS = {
  core: 'Core / Abs',
  back: 'Back',
  shoulders: 'Shoulders',
  chest: 'Chest',
  triceps: 'Triceps',
  biceps: 'Biceps',
  legs: 'Legs',
  calves: 'Calves',
};

// All exercises tagged to a given muscle key, in catalog order.
function exercisesForMuscle(muscle) {
  return EXERCISES.filter((ex) => ex.muscles.includes(muscle));
}
