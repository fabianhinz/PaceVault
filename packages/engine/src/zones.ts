// Sources: [Daniels2013], [Karvonen1957], [CogganAllen2010]
// See packages/engine/SOURCES.md for full citations.

import type { RunningZone, RunningZoneName, SessionRecord } from './types.ts';
import { activeDurationSec } from './recordPairs.ts';

const RUNNING_ZONE_PACE_FACTORS: {
  name: RunningZoneName;
  slowestPaceFactor: number;
  fastestPaceFactor: number;
}[] = [
  { name: 'recovery', slowestPaceFactor: 1.4, fastestPaceFactor: 1.29 },
  { name: 'easy', slowestPaceFactor: 1.29, fastestPaceFactor: 1.16 },
  { name: 'tempo', slowestPaceFactor: 1.16, fastestPaceFactor: 1.05 },
  { name: 'threshold', slowestPaceFactor: 1.05, fastestPaceFactor: 0.97 },
  { name: 'vo2max', slowestPaceFactor: 0.97, fastestPaceFactor: 0.86 },
];

export const HEART_RATE_ZONES = [
  { zone: 'Z1', name: 'recovery', minPct: 0.5, maxPct: 0.6 },
  { zone: 'Z2', name: 'aerobic', minPct: 0.6, maxPct: 0.7 },
  { zone: 'Z3', name: 'tempo', minPct: 0.7, maxPct: 0.8 },
  { zone: 'Z4', name: 'threshold', minPct: 0.8, maxPct: 0.9 },
  { zone: 'Z5', name: 'vo2max', minPct: 0.9, maxPct: 1.0 },
] as const;

export type HeartRateZoneName = (typeof HEART_RATE_ZONES)[number]['name'];

export const POWER_ZONES = [
  { zone: 'Z1', name: 'active_recovery', minPct: 0, maxPct: 0.55 },
  { zone: 'Z2', name: 'endurance', minPct: 0.55, maxPct: 0.75 },
  { zone: 'Z3', name: 'tempo', minPct: 0.75, maxPct: 0.9 },
  { zone: 'Z4', name: 'threshold', minPct: 0.9, maxPct: 1.05 },
  { zone: 'Z5', name: 'vo2max', minPct: 1.05, maxPct: 1.2 },
  { zone: 'Z6', name: 'anaerobic', minPct: 1.2, maxPct: 1.5 },
  { zone: 'Z7', name: 'neuromuscular', minPct: 1.5, maxPct: Infinity },
] as const;

export type PowerZoneName = (typeof POWER_ZONES)[number]['name'];

export const runningZonesFromThresholdPace = (thresholdPaceSecPerKm: number): RunningZone[] => {
  return RUNNING_ZONE_PACE_FACTORS.map((zoneFactors) => ({
    name: zoneFactors.name,
    slowestPaceSecPerKm: Math.round(thresholdPaceSecPerKm * zoneFactors.slowestPaceFactor),
    fastestPaceSecPerKm: Math.round(thresholdPaceSecPerKm * zoneFactors.fastestPaceFactor),
  }));
};

export const zoneForPace = ({
  paceSecPerKm,
  zones,
}: {
  paceSecPerKm: number;
  zones: RunningZone[];
}): RunningZone | undefined => {
  return zones.find(
    (zone) => paceSecPerKm <= zone.slowestPaceSecPerKm && paceSecPerKm >= zone.fastestPaceSecPerKm,
  );
};

export const zoneMidPace = (zone: RunningZone): number => {
  return Math.round((zone.slowestPaceSecPerKm + zone.fastestPaceSecPerKm) / 2);
};

export const secondsInZones = ({
  records,
  zoneIndexAt,
  zoneCount,
}: {
  records: SessionRecord[];
  zoneIndexAt: (hr: number) => number;
  zoneCount: number;
}): number[] => {
  const durationSecByZone = Array.from({ length: zoneCount }, () => 0);
  for (let i = 1; i < records.length; i++) {
    const previous = records[i - 1];
    const current = records[i];
    if (!previous || current?.hr === undefined) continue;
    const elapsedSec = activeDurationSec({ previous, current });
    if (elapsedSec === 0) continue;
    const zone = zoneIndexAt(current.hr);
    const zoneSec = durationSecByZone[zone];
    if (zoneSec === undefined) continue;
    durationSecByZone[zone] = zoneSec + elapsedSec;
  }
  return durationSecByZone;
};
