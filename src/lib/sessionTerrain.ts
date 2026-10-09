import type { SessionRecord, Sport } from '@/packages/engine/types.ts';
import { windowedGradients } from '@/packages/engine/gradient.ts';
import { detectClimbs, type Climb } from '@/packages/engine/climbs.ts';
import { movingSeconds } from './movingTime.ts';

export interface SessionTerrain {
  gradients: Array<number | undefined>;
  climbs: Climb[];
  inClimb: boolean[];
}

export interface ClimbSpan {
  from: number;
  to: number;
  vam: number;
}

export const buildSessionTerrain = (sport: Sport, records: SessionRecord[]): SessionTerrain => {
  const gradients = windowedGradients(records);
  const climbs = detectClimbs(sport, records, gradients);
  const inClimb = records.map(() => false);
  for (const climb of climbs) {
    for (let i = climb.startIndex; i <= climb.endIndex; i++) inClimb[i] = true;
  }
  return { gradients, climbs, inClimb };
};

export const climbSpansInMinutes = (records: SessionRecord[], climbs: Climb[]): ClimbSpan[] => {
  const moving = movingSeconds(records);
  return climbs.map((climb) => ({
    from: (moving[climb.startIndex] ?? 0) / 60,
    to: (moving[climb.endIndex] ?? 0) / 60,
    vam: climb.vam,
  }));
};

export const climbSpanAt = (spans: ClimbSpan[], minute: number): ClimbSpan | undefined =>
  spans.find((span) => minute >= span.from && minute <= span.to);
