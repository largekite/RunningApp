import { HRZone, HRZoneInfo } from '../context/types';

interface ZoneDefinition {
  zone: HRZone;
  name: string;
  lowerPct: number;
  upperPct: number;
  color: string;
  description: string;
}

const ZONE_DEFINITIONS: ZoneDefinition[] = [
  {
    zone: 1,
    name: 'Recovery',
    lowerPct: 0.50,
    upperPct: 0.60,
    color: '#4caf50',
    description: 'Very easy effort. Conversational pace. Used for warm-up, cool-down, and active recovery days. Builds aerobic base without stress.',
  },
  {
    zone: 2,
    name: 'Aerobic',
    lowerPct: 0.60,
    upperPct: 0.70,
    color: '#2196f3',
    description: 'Comfortable, sustainable effort. You can hold a conversation. The foundation of endurance training — improves fat burning and aerobic capacity.',
  },
  {
    zone: 3,
    name: 'Tempo',
    lowerPct: 0.70,
    upperPct: 0.80,
    color: '#ff9800',
    description: 'Moderate-hard effort. Speaking in short sentences. Improves lactate threshold and running economy. Typical tempo run zone.',
  },
  {
    zone: 4,
    name: 'Threshold',
    lowerPct: 0.80,
    upperPct: 0.90,
    color: '#f44336',
    description: 'Hard effort. Difficult to speak. At or near lactate threshold. Used for interval training to push performance ceiling.',
  },
  {
    zone: 5,
    name: 'VO2max',
    lowerPct: 0.90,
    upperPct: 1.00,
    color: '#9c27b0',
    description: 'Maximum effort. Cannot sustain for long. Develops maximal oxygen uptake (VO2max) and neuromuscular power. Used in short, high-intensity intervals.',
  },
];

/**
 * Calculate HR zones using the Karvonen (Heart Rate Reserve) method.
 * HRR = maxHR - restingHR
 * Target HR = (HRR * intensity%) + restingHR
 */
export function calculateHRZones(maxHR: number, restingHR: number): HRZoneInfo[] {
  const hrr = maxHR - restingHR;
  return ZONE_DEFINITIONS.map((def) => ({
    zone: def.zone,
    name: def.name,
    minBpm: Math.round(hrr * def.lowerPct + restingHR),
    maxBpm: Math.round(hrr * def.upperPct + restingHR),
    color: def.color,
    description: def.description,
  }));
}

/**
 * Get the HR zone a given heart rate falls into.
 * Returns null if the HR is below zone 1 minimum.
 */
export function getZoneForHR(hr: number, maxHR: number, restingHR: number): HRZoneInfo | null {
  const zones = calculateHRZones(maxHR, restingHR);
  // Check zones from highest to lowest so we get the right one at boundaries
  for (let i = zones.length - 1; i >= 0; i--) {
    if (hr >= zones[i].minBpm) {
      return zones[i];
    }
  }
  return null;
}

/**
 * Get HR zones using a default resting HR of 60 bpm.
 */
export function getDefaultZones(maxHR: number): HRZoneInfo[] {
  return calculateHRZones(maxHR, 60);
}

/**
 * Estimate maximum heart rate using the 220 - age formula.
 */
export function estimateMaxHR(age: number): number {
  return 220 - age;
}
