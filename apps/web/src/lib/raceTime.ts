import { m } from '@pacevault/i18n/messages.js';
import type { RaceDistance } from '@pacevault/engine/types.ts';

export const DISTANCE_OPTIONS: Array<{ value: RaceDistance; label: string }> = [
  { value: '5k', label: m.ui_pace_est_5k() },
  { value: '10k', label: m.ui_pace_est_10k() },
  { value: 'half-marathon', label: m.ui_pace_est_half_marathon() },
  { value: 'marathon', label: m.ui_pace_est_marathon() },
];

export const usesLongFormat = (distance: RaceDistance): boolean =>
  distance === 'half-marathon' || distance === 'marathon';

/**
 * Parses a race time string into minutes.
 * Short format (mm:ss) for 5K/10K, long format (h:mm:ss) for half-marathon/marathon.
 */
export const parseRaceTime = (input: string, distance: RaceDistance): number | undefined => {
  if (usesLongFormat(distance)) {
    const match = input.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
    if (!match) return undefined;
    const h = Number(match[1]);
    const mins = Number(match[2]);
    const s = Number(match[3]);
    if (mins >= 60 || s >= 60) return undefined;
    const total = h * 60 + mins + s / 60;
    if (total > 0) {
      return total;
    }
    return undefined;
  }
  const match = input.match(/^(\d{1,3}):(\d{2})$/);
  if (!match) return undefined;
  const mins = Number(match[1]);
  const s = Number(match[2]);
  if (s >= 60) return undefined;
  const total = mins + s / 60;
  if (total > 0) {
    return total;
  }
  return undefined;
};
