import type { SessionRecord, Sport } from './types.ts';
import { isMovingPair } from './recordPairs.ts';

export interface Climb {
  startIndex: number;
  endIndex: number;
  gain: number;
  movingSec: number;
  vam: number;
}

interface ClimbRules {
  enterGradient: number;
  exitGradient: number;
  minGainMeters: number;
  minSec: number;
  mergeGapSec: number;
}

interface ClimbSpan {
  startIndex: number;
  endIndex: number;
  endsAtMissingElevation: boolean;
}

interface ClimbEffort {
  gain: number;
  movingSec: number;
}

const CLIMB_RULES_BY_SPORT: Record<Sport, ClimbRules> = {
  running: {
    enterGradient: 0.15,
    exitGradient: 0.1,
    minGainMeters: 40,
    minSec: 90,
    mergeGapSec: 120,
  },
  cycling: {
    enterGradient: 0.05,
    exitGradient: 0.03,
    minGainMeters: 50,
    minSec: 120,
    mergeGapSec: 60,
  },
};

const findSteepSpans = ({
  records,
  gradients,
  rules,
}: {
  records: SessionRecord[];
  gradients: Array<number | undefined>;
  rules: ClimbRules;
}): ClimbSpan[] => {
  const spans: ClimbSpan[] = [];
  let start: number | undefined = undefined;
  let lastInside = 0;
  const close = (endsAtMissingElevation: boolean) => {
    if (start === undefined) return;
    spans.push({ startIndex: start, endIndex: lastInside, endsAtMissingElevation });
    start = undefined;
  };
  records.forEach((record, i) => {
    if (record.distance === undefined) return;
    const gradient = gradients[i];
    if (start === undefined) {
      if (gradient === undefined || gradient < rules.enterGradient) return;
      start = i;
      lastInside = i;
      return;
    }
    if (gradient === undefined) {
      close(true);
      return;
    }
    if (gradient < rules.exitGradient) {
      close(false);
      return;
    }
    lastInside = i;
  });
  close(false);
  return spans;
};

const mergeCloseSpans = ({
  records,
  spans,
  rules,
}: {
  records: SessionRecord[];
  spans: ClimbSpan[];
  rules: ClimbRules;
}): ClimbSpan[] => {
  const merged: ClimbSpan[] = [];
  for (const span of spans) {
    const last = merged[merged.length - 1];
    const lastEnd = last && records[last.endIndex];
    const nextStart = records[span.startIndex];
    if (
      last &&
      lastEnd &&
      nextStart &&
      !last.endsAtMissingElevation &&
      nextStart.timestamp - lastEnd.timestamp < rules.mergeGapSec
    ) {
      last.endIndex = span.endIndex;
      last.endsAtMissingElevation = span.endsAtMissingElevation;
      continue;
    }
    merged.push({ ...span });
  }
  return merged;
};

const effortBetween = ({
  records,
  startIndex,
  endIndex,
}: {
  records: SessionRecord[];
  startIndex: number;
  endIndex: number;
}): ClimbEffort => {
  let gain = 0;
  let movingSec = 0;
  for (let i = startIndex + 1; i <= endIndex; i++) {
    const previous = records[i - 1];
    const current = records[i];
    if (!previous || !current) continue;
    if (previous.elevation === undefined || current.elevation === undefined) continue;
    if (!isMovingPair({ previous, current })) continue;
    gain += current.elevation - previous.elevation;
    movingSec += current.timestamp - previous.timestamp;
  }
  return { gain, movingSec };
};

const metresPerHour = (effort: ClimbEffort): number =>
  Math.round(((effort.gain / effort.movingSec) * 3600) / 10) * 10;

export const detectClimbs = ({
  sport,
  records,
  gradients,
}: {
  sport: Sport;
  records: SessionRecord[];
  gradients: Array<number | undefined>;
}): Climb[] => {
  const rules = CLIMB_RULES_BY_SPORT[sport];
  const spans = mergeCloseSpans({
    records,
    spans: findSteepSpans({ records, gradients, rules }),
    rules,
  });
  const climbs: Climb[] = [];
  for (const span of spans) {
    const effort = effortBetween({ records, startIndex: span.startIndex, endIndex: span.endIndex });
    if (effort.gain < rules.minGainMeters || effort.movingSec < rules.minSec) continue;
    climbs.push({
      startIndex: span.startIndex,
      endIndex: span.endIndex,
      gain: effort.gain,
      movingSec: effort.movingSec,
      vam: metresPerHour(effort),
    });
  }
  return climbs;
};

export const climbingRate = ({
  records,
  climbs,
  startIndex,
  endIndex,
}: {
  records: SessionRecord[];
  climbs: Climb[];
  startIndex: number;
  endIndex: number;
}): number | undefined => {
  const total: ClimbEffort = { gain: 0, movingSec: 0 };
  for (const climb of climbs) {
    const from = Math.max(climb.startIndex, startIndex);
    const to = Math.min(climb.endIndex, endIndex);
    if (to <= from) continue;
    const effort = effortBetween({ records, startIndex: from, endIndex: to });
    total.gain += effort.gain;
    total.movingSec += effort.movingSec;
  }
  if (total.movingSec === 0) return undefined;
  return metresPerHour(total);
};
