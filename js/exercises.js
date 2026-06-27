// Static exercise catalog, transcribed from the build spec.
// `muscles` is an array so an exercise can appear under more than one muscle
// group. Muscle keys used by the body diagram:
//   core, back, shoulders, chest, triceps, biceps, legs, calves
// `weight` / `repsSets` are the current working defaults; once logging exists,
// the most recent log entry overrides "last used" at display time. Bodyweight
// moves use weight: 'bodyweight' — reps or hold time is the number to track.
// `equipment` tags what gear an exercise needs ('dumbbell' or 'bodyweight'),
// so the list can later be filtered by what's currently available. Pull-up-bar
// moves are tagged 'bodyweight'.
const EXERCISES = [
  // --- Core ---
  { id: 'plank',                  name: 'Plank',                          muscles: ['core'],          weight: 'bodyweight',     repsSets: 'hold ~50 sec x 3',        equipment: 'bodyweight', cue: "Straight line, don't let hips sag" },
  { id: 'dead-bug',               name: 'Dead bug',                       muscles: ['core'],          weight: 'bodyweight',     repsSets: '15 each side x 3',        equipment: 'bodyweight', cue: 'Lower back stays flat on floor' },
  { id: 'weighted-crunch',        name: 'Weighted crunch',                muscles: ['core'],          weight: '5 kg',           repsSets: '12–15 x 3',               equipment: 'dumbbell',   cue: 'Curl shoulders up, squeeze abs, lower slowly' },
  { id: 'crunch',                 name: 'Crunch',                         muscles: ['core'],          weight: 'bodyweight',     repsSets: '15–20 x 3',               equipment: 'bodyweight', cue: 'Curl shoulders up, squeeze abs, lower slowly' },
  { id: 'standing-twist',         name: 'Standing twist',                 muscles: ['core'],          weight: '10 kg',          repsSets: '10 each side x 3',        equipment: 'dumbbell',   cue: 'Start with left side, control the swing' },
  { id: 'russian-twist',          name: 'Russian twist',                  muscles: ['core'],          weight: 'bodyweight',     repsSets: '20 each side x 3',        equipment: 'bodyweight', cue: 'Lean back, feet up, rotate torso side to side under control' },
  { id: 'suitcase-carry',         name: 'Suitcase carry',                 muscles: ['core'],          weight: '20 kg',          repsSets: '30 steps each side x 3',  equipment: 'dumbbell',   cue: "Don't lean to the side" },
  { id: 'side-plank',             name: 'Side plank',                     muscles: ['core'],          weight: 'bodyweight',     repsSets: '30 sec each side',        equipment: 'bodyweight', cue: 'Optional extra' },
  { id: 'side-plank-hip-dip',     name: 'Side plank with hip dip',        muscles: ['core'],          weight: 'bodyweight',     repsSets: '12 each side x 3',        equipment: 'bodyweight', cue: 'Lower hip toward the floor, then drive it back up' },

  // --- Back ---
  { id: 'single-arm-row',         name: 'Single-arm row',                 muscles: ['back'],          weight: '14 kg',          repsSets: '10 each arm x 3',         equipment: 'dumbbell',   cue: 'Knee + hand on bench, pull to ribs' },
  { id: 'shrug',                  name: 'Shrug',                          muscles: ['back'],          weight: '12 kg each hand', repsSets: '12 x 3',                 equipment: 'dumbbell',   cue: 'Straight up and down, no rolling' },
  { id: 'superman',               name: 'Superman',                       muscles: ['back'],          weight: 'bodyweight',     repsSets: '10 x 3',                  equipment: 'bodyweight', cue: 'Lift chest, arms, legs together, hold 1 sec' },

  // --- Back / Biceps (pull-up bar) ---
  // Pull-up progression as three stages; the full pull-up is the main progress signal.
  { id: 'pull-up-dead-hang',      name: 'Pull-up: Dead hang',             muscles: ['back', 'biceps'], weight: 'bodyweight',    repsSets: 'hold 20–30 sec x 3',      equipment: 'bodyweight', cue: 'Hang from the bar, shoulder-width grip, arms straight, shoulders engaged' },
  { id: 'pull-up-negative',       name: 'Pull-up: Negative',              muscles: ['back', 'biceps'], weight: 'bodyweight',    repsSets: '5 x 3',                   equipment: 'bodyweight', cue: 'Jump/step to the top, then lower slowly over 3–5 sec' },
  { id: 'pull-up',                name: 'Pull-up',                        muscles: ['back', 'biceps'], weight: 'bodyweight',    repsSets: '5 x 3',                   equipment: 'bodyweight', cue: 'Full range, chin over bar, no kipping — rep count is the main progress signal' },

  // --- Legs ---
  { id: 'goblet-squat',           name: 'Goblet squat',                   muscles: ['legs'],          weight: '16 kg',          repsSets: '10 x 3',                  equipment: 'dumbbell',   cue: 'Hold at chest, chest tall' },
  { id: 'bodyweight-squat',       name: 'Bodyweight squat',               muscles: ['legs'],          weight: 'bodyweight',     repsSets: '15–20 x 3',               equipment: 'bodyweight', cue: 'Chest tall, sit back, knees track over toes' },
  { id: 'glute-bridge',           name: 'Glute bridge',                   muscles: ['legs'],          weight: '14 kg',          repsSets: '12 x 3',                  equipment: 'dumbbell',   cue: 'Dumbbell on hips, drive up, squeeze' },
  { id: 'single-leg-glute-bridge', name: 'Single-leg glute bridge',       muscles: ['legs'],          weight: 'bodyweight',     repsSets: '12 each side x 3',        equipment: 'bodyweight', cue: 'One foot planted, drive hips up, squeeze the glute' },
  { id: 'hip-hinge',              name: 'Hip hinge (Romanian deadlift)',  muscles: ['legs'],          weight: '8 kg each hand', repsSets: '10 x 3',                  equipment: 'dumbbell',   cue: 'Hinge at hips, flat back, NOT round' },
  { id: 'single-leg-rdl',         name: 'Single-leg RDL',                 muscles: ['legs'],          weight: 'bodyweight',     repsSets: '10 each side x 3',        equipment: 'bodyweight', cue: 'Hinge at the hip, flat back, balance on one leg' },

  // --- Calves ---
  { id: 'calf-raise',             name: 'Calf raise',                     muscles: ['calves'],        weight: '20 kg',          repsSets: '15 x 3',                  equipment: 'dumbbell',   cue: 'Slow up, slow down' },
  { id: 'bodyweight-calf-raise',  name: 'Bodyweight calf raise',          muscles: ['calves'],        weight: 'bodyweight',     repsSets: '20 x 3',                  equipment: 'bodyweight', cue: 'Slow up, slow down — go single-leg to progress' },

  // --- Chest ---
  { id: 'db-bench-press',         name: 'Dumbbell bench press',           muscles: ['chest'],         weight: '10 kg',          repsSets: '10 x 3',                  equipment: 'dumbbell',   cue: 'Lower to upper-arm-touches-floor depth' },
  { id: 'push-up',                name: 'Push-up',                        muscles: ['chest'],         weight: 'bodyweight',     repsSets: '10–15 x 3',               equipment: 'bodyweight', cue: 'Straight line head to heels, lower chest to the floor' },

  // --- Shoulders ---
  { id: 'overhead-press',         name: 'Overhead press',                 muscles: ['shoulders'],     weight: '6 kg each hand', repsSets: '10 x 3',                  equipment: 'dumbbell',   cue: 'Press straight overhead' },
  { id: 'pike-push-up',           name: 'Pike push-up',                   muscles: ['shoulders'],     weight: 'bodyweight',     repsSets: '8–12 x 3',                equipment: 'bodyweight', cue: 'Hips high in an inverted V, lower the crown of your head toward the floor' },
  { id: 'lateral-raise',          name: 'Lateral raise',                  muscles: ['shoulders'],     weight: '4 kg',           repsSets: '12 x 3',                  equipment: 'dumbbell',   cue: 'Slow, no swinging, light weight' },
  { id: 'prone-y-raise',          name: 'Prone Y-raise',                  muscles: ['shoulders'],     weight: 'bodyweight',     repsSets: '12–15 x 3',               equipment: 'bodyweight', cue: 'Face down, arms in a Y, lift and squeeze rear delts / lower traps' },

  // --- Triceps ---
  { id: 'oh-triceps-ext',         name: 'Overhead triceps extension',     muscles: ['triceps'],       weight: '8 kg',           repsSets: '12 x 3',                  equipment: 'dumbbell',   cue: "Elbows tucked in, don't flare" },
  { id: 'chair-dips',             name: 'Chair dips',                     muscles: ['triceps'],       weight: 'bodyweight',     repsSets: '10–15 x 3',               equipment: 'bodyweight', cue: 'Hands on a chair edge, lower until elbows ~90°, press back up' },

  // --- Biceps ---
  { id: 'biceps-curl',            name: 'Biceps curl',                    muscles: ['biceps'],        weight: '6–8 kg',         repsSets: '10 x 3',                  equipment: 'dumbbell',   cue: 'Full range, no back swing' },
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
