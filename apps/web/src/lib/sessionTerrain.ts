import type { SessionRecord, Sport } from '@pacevault/engine/types.ts';
import { windowedGradients } from '@pacevault/engine/gradient.ts';
import { detectClimbs, type Climb } from '@pacevault/engine/climbs.ts';
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

export const buildSessionTerrain = ({
  sport,
  records,
}: {
  sport: Sport;
  records: SessionRecord[];
}): SessionTerrain => {
  const gradients = windowedGradients(records);
  const climbs = detectClimbs({ sport, records, gradients });
  const inClimb = records.map(() => false);
  for (const climb of climbs) {
    for (let i = climb.startIndex; i <= climb.endIndex; i++) inClimb[i] = true;
  }
  return { gradients, climbs, inClimb };
};

export const climbSpansInMinutes = ({
  records,
  climbs,
}: {
  records: SessionRecord[];
  climbs: Climb[];
}): ClimbSpan[] => {
  const moving = movingSeconds(records);
  return climbs.map((climb) => ({
    from: (moving[climb.startIndex] ?? 0) / 60,
    to: (moving[climb.endIndex] ?? 0) / 60,
    vam: climb.vam,
  }));
};

export const climbSpanAt = ({
  spans,
  minute,
}: {
  spans: ClimbSpan[];
  minute: number;
}): ClimbSpan | undefined => spans.find((span) => minute >= span.from && minute <= span.to);
