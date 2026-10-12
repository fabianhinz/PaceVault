// Sources: [Karvonen1957], [CogganAllen2010]
// See src/engine/SOURCES.md for full citations.

import type { SessionRecord } from './types.ts';
import { activeSeconds } from './normalize.ts';

export const HR_ZONE_DEFS = [
  { zone: 'Z1', name: 'recovery', label: 'Recovery', minPct: 0.5, maxPct: 0.6, color: '#60a5fa' },
  { zone: 'Z2', name: 'aerobic', label: 'Aerobic', minPct: 0.6, maxPct: 0.7, color: '#34d399' },
  { zone: 'Z3', name: 'tempo', label: 'Tempo', minPct: 0.7, maxPct: 0.8, color: '#fbbf24' },
  { zone: 'Z4', name: 'threshold', label: 'Threshold', minPct: 0.8, maxPct: 0.9, color: '#f97316' },
  { zone: 'Z5', name: 'vo2max', label: 'VO2max', minPct: 0.9, maxPct: 1.0, color: '#ef4444' },
];

export const POWER_ZONE_DEFS = [
  {
    zone: 'Z1',
    name: 'active_recovery',
    label: 'Active Recovery',
    minPct: 0,
    maxPct: 0.55,
    color: '#94a3b8',
  },
  {
    zone: 'Z2',
    name: 'endurance',
    label: 'Endurance',
    minPct: 0.55,
    maxPct: 0.75,
    color: '#60a5fa',
  },
  { zone: 'Z3', name: 'tempo', label: 'Tempo', minPct: 0.75, maxPct: 0.9, color: '#34d399' },
  {
    zone: 'Z4',
    name: 'threshold',
    label: 'Threshold',
    minPct: 0.9,
    maxPct: 1.05,
    color: '#fbbf24',
  },
  { zone: 'Z5', name: 'vo2max', label: 'VO2max', minPct: 1.05, maxPct: 1.2, color: '#f97316' },
  { zone: 'Z6', name: 'anaerobic', label: 'Anaerobic', minPct: 1.2, maxPct: 1.5, color: '#ef4444' },
  {
    zone: 'Z7',
    name: 'neuromuscular',
    label: 'Neuromuscular',
    minPct: 1.5,
    maxPct: Infinity,
    color: '#dc2626',
  },
];

export const secondsInZones = (
  records: SessionRecord[],
  zoneIndexAt: (hr: number) => number,
  zoneCount: number,
): number[] => {
  const seconds = Array.from({ length: zoneCount }, () => 0);
  for (let i = 1; i < records.length; i++) {
    const previous = records[i - 1];
    const current = records[i];
    if (!previous || current?.hr === undefined) continue;
    const dt = activeSeconds(previous, current);
    if (dt === 0) continue;
    const zone = zoneIndexAt(current.hr);
    const total = seconds[zone];
    if (total === undefined) continue;
    seconds[zone] = total + dt;
  }
  return seconds;
};
