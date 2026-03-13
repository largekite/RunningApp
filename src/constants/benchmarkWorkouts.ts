export interface BenchmarkDefinition {
  id: string;
  name: string;
  distanceMiles: number;
  description: string;
  instructions: string[];
  frequency: string;
}

export const BENCHMARK_DEFINITIONS: BenchmarkDefinition[] = [
  {
    id: 'one_mile_tt',
    name: '1-Mile Time Trial',
    distanceMiles: 1.0,
    description:
      'The classic 1-mile effort is the most informative short benchmark for runners. A fast mile reveals your current speed ceiling and serves as the foundation for setting accurate training zones.',
    instructions: [
      'Warm-up: 10–15 minutes easy jogging, then 4 × 20-second strides with 90 seconds recovery.',
      'Find a flat 400m track or measured flat route with minimal turns.',
      'Start your watch and run 1 mile (4 laps on a track) at maximum sustainable effort.',
      'Aim to run even splits — do not go out too fast in the first quarter mile.',
      'Cool-down: 10 minutes easy jogging followed by static stretching.',
      'Record your total time in MM:SS format. Pace per mile = your finish time.',
    ],
    frequency: 'Every 4 weeks',
  },
  {
    id: 'five_k_tt',
    name: '5K Time Trial',
    distanceMiles: 3.1,
    description:
      'The 5K time trial is the gold standard for assessing aerobic fitness and lactate threshold. It correlates strongly with marathon performance and is the best benchmark for overall running fitness.',
    instructions: [
      'Warm-up: 15 minutes easy jog, followed by 4 × 30-second strides with 90 seconds easy jog recovery.',
      'Run on a flat, measured course — a track (12.5 laps) or a certified road course.',
      'Run 3.1 miles at the fastest pace you can sustain for the full distance.',
      'Target even splits or a slight negative split (second half slightly faster than first).',
      'Cool-down: 10–15 minutes easy jogging.',
      'Record total time in MM:SS. The app will calculate your pace per mile automatically.',
    ],
    frequency: 'Every 4–6 weeks',
  },
  {
    id: 'two_mile_effort',
    name: '2-Mile Effort',
    distanceMiles: 2.0,
    description:
      'The 2-mile effort bridges the gap between speed (1 mile) and endurance (5K). It is excellent for tracking VO2max-level fitness and works well on a track or out-and-back flat route.',
    instructions: [
      'Warm-up: 10 minutes easy jog, 3 × 20-second strides.',
      'Run 2 miles (8 laps on a track) at a hard but controlled effort — approximately RPE 8/10.',
      'Aim to maintain consistent effort throughout. The second mile will feel harder than the first.',
      'You should be breathing very hard but still able to complete the distance.',
      'Cool-down: 10 minutes easy jog and stretching.',
      'Record total time. Use this test to estimate your current VO2max running pace.',
    ],
    frequency: 'Every 4–5 weeks',
  },
  {
    id: 'ten_min_tempo',
    name: '10-Minute Tempo Test',
    distanceMiles: 1.2,
    description:
      'A time-based tempo test that reveals how much distance you can cover at lactate threshold in 10 minutes. More accessible than a distance time trial and easy to repeat consistently.',
    instructions: [
      'Warm-up: 15 minutes easy running, then 5 minutes at a comfortable pace.',
      'Start your timer and run as far as possible in exactly 10 minutes at a hard but controlled effort (RPE 7–8/10). You should be able to speak only a word or two.',
      'Run on a flat, measured route — a track is ideal so you can count distance easily.',
      'Do not sprint. The effort should be sustainable for the full 10 minutes.',
      'When the timer ends, note your exact location and measure the distance covered.',
      'Cool-down: 10 minutes easy jog.',
      'Log the distance you covered. The test estimates your threshold pace (distance ÷ 10 minutes).',
    ],
    frequency: 'Every 3–4 weeks',
  },
];

/**
 * Look up a benchmark definition by its ID.
 */
export function getBenchmarkById(id: string): BenchmarkDefinition | undefined {
  return BENCHMARK_DEFINITIONS.find((b) => b.id === id);
}
