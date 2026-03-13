import { WorkoutType } from '../context/types';

export type ExerciseCategory = 'activation' | 'strength' | 'mobility' | 'cooldown';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  sets?: number;
  reps?: string;
  description: string;
  muscleGroups: string[];
  icon: string; // MaterialCommunityIcons name
}

export interface WorkoutStrengthPlan {
  workoutType: WorkoutType;
  label: string;
  preRun: Exercise[];
  postRun: Exercise[];
}

export const EXERCISES: Exercise[] = [
  {
    id: 'glute_bridge',
    name: 'Glute Bridges',
    category: 'activation',
    sets: 3,
    reps: '15',
    description: 'Lie on your back with knees bent. Drive hips upward by squeezing glutes, hold for 2 seconds at the top, then lower slowly.',
    muscleGroups: ['Glutes', 'Hamstrings', 'Core'],
    icon: 'human',
  },
  {
    id: 'calf_raises',
    name: 'Calf Raises',
    category: 'strength',
    sets: 3,
    reps: '20',
    description: 'Stand on the edge of a step. Rise onto toes, hold for 1 second, then slowly lower below the step level for full range of motion.',
    muscleGroups: ['Calves', 'Achilles'],
    icon: 'walk',
  },
  {
    id: 'single_leg_deadlift',
    name: 'Single-Leg Deadlift',
    category: 'strength',
    sets: 3,
    reps: '8 each side',
    description: 'Stand on one leg, hinge at the hip while extending the opposite leg behind you. Keep back flat and reach toward the floor. Return to standing.',
    muscleGroups: ['Glutes', 'Hamstrings', 'Balance'],
    icon: 'human-handsdown',
  },
  {
    id: 'hip_flexor_stretch',
    name: 'Hip Flexor Stretch',
    category: 'mobility',
    sets: 1,
    reps: '45 sec each side',
    description: 'Kneel on one knee in a lunge position. Tuck your pelvis under and lean slightly forward until you feel a stretch in the front of the back hip. Hold and breathe deeply.',
    muscleGroups: ['Hip Flexors', 'Psoas'],
    icon: 'run',
  },
  {
    id: 'it_band_foam_roll',
    name: 'IT Band Foam Roll',
    category: 'mobility',
    sets: 1,
    reps: '60 sec each side',
    description: 'Lie on your side with the foam roller under the outer thigh. Using your arms for support, slowly roll from just below the hip to just above the knee. Pause on tender spots.',
    muscleGroups: ['IT Band', 'TFL'],
    icon: 'yoga',
  },
  {
    id: 'pigeon_pose',
    name: 'Pigeon Pose',
    category: 'cooldown',
    sets: 1,
    reps: '60 sec each side',
    description: 'From a plank, bring one knee forward toward the same-side wrist. Extend the other leg back. Lower your hips and fold forward over the front shin. Breathe into the hip stretch.',
    muscleGroups: ['Glutes', 'Hip Rotators', 'Piriformis'],
    icon: 'yoga',
  },
  {
    id: 'hamstring_stretch',
    name: 'Standing Hamstring Stretch',
    category: 'cooldown',
    sets: 1,
    reps: '45 sec each side',
    description: 'Place one foot on a slightly elevated surface with leg straight. Hinge forward at the hip keeping your back flat until you feel a stretch in the back of the thigh.',
    muscleGroups: ['Hamstrings'],
    icon: 'human-handsup',
  },
  {
    id: 'quad_stretch',
    name: 'Standing Quad Stretch',
    category: 'cooldown',
    sets: 1,
    reps: '30 sec each side',
    description: 'Stand on one leg, pull the other foot toward your glutes. Keep knees together and stand tall. Use a wall for balance if needed.',
    muscleGroups: ['Quadriceps'],
    icon: 'human',
  },
  {
    id: 'ankle_circles',
    name: 'Ankle Circles',
    category: 'activation',
    sets: 1,
    reps: '15 each direction, each foot',
    description: 'Sit or stand and lift one foot. Rotate the ankle slowly in large circles — clockwise then counterclockwise. This improves ankle mobility and reduces injury risk.',
    muscleGroups: ['Ankles', 'Calves'],
    icon: 'circle-outline',
  },
  {
    id: 'dead_bug',
    name: 'Dead Bug',
    category: 'activation',
    sets: 3,
    reps: '8 each side',
    description: 'Lie on your back, arms pointing up, knees at 90°. Slowly extend one arm overhead while extending the opposite leg. Keep lower back pressed into the floor. Return and alternate.',
    muscleGroups: ['Core', 'Transverse Abdominis'],
    icon: 'bug',
  },
  {
    id: 'side_plank',
    name: 'Side Plank',
    category: 'strength',
    sets: 3,
    reps: '30 sec each side',
    description: 'Lie on your side and prop up on your forearm with feet stacked. Lift your hips to form a straight line from head to feet. Engage your core throughout.',
    muscleGroups: ['Obliques', 'Hip Abductors', 'Core'],
    icon: 'human-female',
  },
  {
    id: 'monster_walks',
    name: 'Monster Walks',
    category: 'activation',
    sets: 3,
    reps: '15 steps each direction',
    description: 'Place a resistance band around your ankles. Stand with slight squat. Step sideways maintaining tension in the band. Keep toes forward throughout.',
    muscleGroups: ['Glutes', 'Hip Abductors'],
    icon: 'walk',
  },
  {
    id: 'high_knees',
    name: 'High Knees',
    category: 'activation',
    sets: 2,
    reps: '30 sec',
    description: 'Run in place driving knees up to hip height with each step. Land softly on the balls of your feet. Swing arms in opposition to legs.',
    muscleGroups: ['Hip Flexors', 'Calves', 'Core'],
    icon: 'run-fast',
  },
  {
    id: 'leg_swings',
    name: 'Leg Swings',
    category: 'activation',
    sets: 1,
    reps: '15 each direction, each leg',
    description: 'Hold a wall for balance. Swing one leg forward and backward through a comfortable range of motion. Then swing the same leg side to side across your body.',
    muscleGroups: ['Hip Flexors', 'Hamstrings', 'Adductors'],
    icon: 'human-male',
  },
  {
    id: 'hip_circles',
    name: 'Hip Circles',
    category: 'activation',
    sets: 1,
    reps: '10 each direction',
    description: 'Stand with feet shoulder-width apart, hands on hips. Make large circular motions with your hips — forward, side, back, side. Gradually increase the size of the circles.',
    muscleGroups: ['Hip Flexors', 'Glutes', 'Lower Back'],
    icon: 'circle',
  },
  {
    id: 'donkey_kicks',
    name: 'Donkey Kicks',
    category: 'activation',
    sets: 3,
    reps: '15 each side',
    description: 'Start on hands and knees. Keeping the knee bent at 90°, lift one leg toward the ceiling, driving through the heel. Squeeze the glute at the top. Lower and repeat.',
    muscleGroups: ['Glutes', 'Hamstrings'],
    icon: 'human-handsdown',
  },
  {
    id: 'clam_shells',
    name: 'Clamshells',
    category: 'activation',
    sets: 3,
    reps: '20 each side',
    description: 'Lie on your side with hips and knees bent at 45°. Keeping feet together, rotate the top knee upward like a clamshell opening. Do not let the hips roll back.',
    muscleGroups: ['Glutes', 'Hip Abductors', 'Piriformis'],
    icon: 'circle-half-full',
  },
  {
    id: 'standing_calf_stretch',
    name: 'Standing Calf Stretch',
    category: 'cooldown',
    sets: 1,
    reps: '45 sec each side',
    description: 'Stand facing a wall with hands on it. Step one foot back with heel flat on the floor. Lean forward gently until you feel a stretch in the calf. Keep the back knee straight.',
    muscleGroups: ['Gastrocnemius', 'Achilles'],
    icon: 'walk',
  },
  {
    id: 'soleus_stretch',
    name: 'Soleus Stretch',
    category: 'cooldown',
    sets: 1,
    reps: '45 sec each side',
    description: 'Same as the standing calf stretch, but bend the back knee slightly. This shifts the stretch from the gastrocnemius to the deeper soleus muscle and Achilles tendon.',
    muscleGroups: ['Soleus', 'Achilles'],
    icon: 'walk',
  },
  {
    id: 'figure_four_stretch',
    name: 'Figure Four Stretch',
    category: 'cooldown',
    sets: 1,
    reps: '60 sec each side',
    description: 'Lie on your back with one ankle crossed over the opposite knee. Clasp your hands behind the lower thigh and gently pull toward your chest until you feel a deep hip stretch.',
    muscleGroups: ['Glutes', 'Piriformis', 'Hip Rotators'],
    icon: 'human',
  },
  {
    id: 'inchworm',
    name: 'Inchworm',
    category: 'activation',
    sets: 2,
    reps: '6',
    description: 'Stand tall. Walk your hands out to a plank position, then walk your feet up to your hands. This warms up the hamstrings, calves, and shoulders dynamically.',
    muscleGroups: ['Hamstrings', 'Calves', 'Core', 'Shoulders'],
    icon: 'human-handsdown',
  },
  {
    id: 'hip_thrust',
    name: 'Hip Thrust',
    category: 'strength',
    sets: 3,
    reps: '12',
    description: 'Sit with upper back against a bench, knees bent, feet flat. Drive hips up by squeezing glutes until thighs are parallel to the floor. Hold 1 second at the top.',
    muscleGroups: ['Glutes', 'Hamstrings'],
    icon: 'human',
  },
];

// Helper to find exercises by ID
function findById(id: string): Exercise {
  const ex = EXERCISES.find((e) => e.id === id);
  if (!ex) throw new Error(`Exercise not found: ${id}`);
  return ex;
}

const STRENGTH_PLANS: WorkoutStrengthPlan[] = [
  {
    workoutType: 'easy_run',
    label: 'Easy Run',
    preRun: [
      findById('ankle_circles'),
      findById('leg_swings'),
      findById('hip_circles'),
      findById('high_knees'),
    ],
    postRun: [
      findById('standing_calf_stretch'),
      findById('quad_stretch'),
      findById('hamstring_stretch'),
      findById('hip_flexor_stretch'),
    ],
  },
  {
    workoutType: 'long_run',
    label: 'Long Run',
    preRun: [
      findById('ankle_circles'),
      findById('leg_swings'),
      findById('hip_circles'),
      findById('monster_walks'),
      findById('glute_bridge'),
      findById('high_knees'),
      findById('inchworm'),
    ],
    postRun: [
      findById('standing_calf_stretch'),
      findById('soleus_stretch'),
      findById('it_band_foam_roll'),
      findById('pigeon_pose'),
      findById('hamstring_stretch'),
      findById('hip_flexor_stretch'),
      findById('figure_four_stretch'),
    ],
  },
  {
    workoutType: 'tempo',
    label: 'Tempo Run',
    preRun: [
      findById('leg_swings'),
      findById('high_knees'),
      findById('monster_walks'),
      findById('glute_bridge'),
      findById('dead_bug'),
      findById('inchworm'),
    ],
    postRun: [
      findById('standing_calf_stretch'),
      findById('soleus_stretch'),
      findById('quad_stretch'),
      findById('hamstring_stretch'),
      findById('hip_flexor_stretch'),
    ],
  },
  {
    workoutType: 'intervals',
    label: 'Interval Workout',
    preRun: [
      findById('leg_swings'),
      findById('high_knees'),
      findById('monster_walks'),
      findById('glute_bridge'),
      findById('dead_bug'),
      findById('ankle_circles'),
    ],
    postRun: [
      findById('standing_calf_stretch'),
      findById('soleus_stretch'),
      findById('it_band_foam_roll'),
      findById('quad_stretch'),
      findById('hamstring_stretch'),
    ],
  },
  {
    workoutType: 'hill_repeats',
    label: 'Hill Repeats',
    preRun: [
      findById('glute_bridge'),
      findById('donkey_kicks'),
      findById('clam_shells'),
      findById('monster_walks'),
      findById('single_leg_deadlift'),
      findById('leg_swings'),
    ],
    postRun: [
      findById('standing_calf_stretch'),
      findById('soleus_stretch'),
      findById('pigeon_pose'),
      findById('figure_four_stretch'),
      findById('hip_flexor_stretch'),
    ],
  },
  {
    workoutType: 'recovery',
    label: 'Recovery Run',
    preRun: [
      findById('ankle_circles'),
      findById('hip_circles'),
      findById('leg_swings'),
    ],
    postRun: [
      findById('standing_calf_stretch'),
      findById('soleus_stretch'),
      findById('it_band_foam_roll'),
      findById('pigeon_pose'),
      findById('hamstring_stretch'),
      findById('hip_flexor_stretch'),
      findById('figure_four_stretch'),
      findById('quad_stretch'),
    ],
  },
  {
    workoutType: 'cross_training',
    label: 'Cross Training',
    preRun: [
      findById('inchworm'),
      findById('high_knees'),
      findById('hip_circles'),
      findById('dead_bug'),
    ],
    postRun: [
      findById('standing_calf_stretch'),
      findById('hip_flexor_stretch'),
      findById('hamstring_stretch'),
      findById('side_plank'),
      findById('pigeon_pose'),
    ],
  },
  {
    workoutType: 'fartlek',
    label: 'Fartlek',
    preRun: [
      findById('leg_swings'),
      findById('high_knees'),
      findById('glute_bridge'),
      findById('monster_walks'),
    ],
    postRun: [
      findById('standing_calf_stretch'),
      findById('quad_stretch'),
      findById('hamstring_stretch'),
      findById('pigeon_pose'),
    ],
  },
  {
    workoutType: 'strides',
    label: 'Strides',
    preRun: [
      findById('ankle_circles'),
      findById('leg_swings'),
      findById('high_knees'),
      findById('donkey_kicks'),
    ],
    postRun: [
      findById('standing_calf_stretch'),
      findById('quad_stretch'),
      findById('hamstring_stretch'),
    ],
  },
  {
    workoutType: 'benchmark',
    label: 'Benchmark / Time Trial',
    preRun: [
      findById('inchworm'),
      findById('leg_swings'),
      findById('high_knees'),
      findById('glute_bridge'),
      findById('monster_walks'),
      findById('ankle_circles'),
    ],
    postRun: [
      findById('standing_calf_stretch'),
      findById('soleus_stretch'),
      findById('quad_stretch'),
      findById('hamstring_stretch'),
      findById('pigeon_pose'),
      findById('figure_four_stretch'),
    ],
  },
];

/**
 * Get the strength and mobility plan for a given workout type.
 * Returns null for rest days.
 */
export function getStrengthPlan(workoutType: WorkoutType): WorkoutStrengthPlan | null {
  if (workoutType === 'rest') return null;
  return STRENGTH_PLANS.find((p) => p.workoutType === workoutType) ?? null;
}
