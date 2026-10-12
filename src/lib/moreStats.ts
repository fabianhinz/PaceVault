import type { SessionRecord, Sport, TrainingSession } from '@/packages/engine/types.ts';
import { windowedGradients } from '@/packages/engine/gradient.ts';
import { isMovingPair } from '@/packages/engine/normalize.ts';
import { timeWeightedMean } from '@/packages/engine/sessionDerivation.ts';
import { intensityFactor, variabilityIndex } from '@/packages/engine/stress.ts';
import { coastingSeconds, stepLength } from '@/packages/engine/cadence.ts';
import { secondsInZones } from '@/packages/engine/zoneDistribution.ts';
import {
  aerobicDecoupling,
  type Decoupling,
  type DecouplingRatio,
} from '@/packages/engine/decoupling.ts';
import {
  estimateSessionEnergy,
  sessionWorkKj,
  type EnergyBlocked,
  type EnergyEstimate,
} from '@/packages/engine/energy.ts';
import { extractPeakPower } from './records.ts';
import { sessionMovingTime } from './movingTime.ts';
import { zoneScale } from './zoneColors.ts';
import type { ResolvedThresholds } from './thresholdsAt.ts';

export type MoreStatsTopic = 'calories' | 'power' | 'stride' | 'zones' | 'decoupling';

export const PEAK_WINDOWS = [
  { seconds: 5, label: '5s' },
  { seconds: 60, label: '1m' },
  { seconds: 300, label: '5m' },
  { seconds: 1200, label: '20m' },
  { seconds: 3600, label: '60m' },
] as const;

const HIGHLIGHT_PEAK_SECONDS = 1200;

export const DECOUPLING_RATIO_LABELS: Record<DecouplingRatio, string> = {
  powerHr: 'Pw:HR',
  gapHr: 'GAP:HR',
  speedHr: 'Speed:HR',
};

const HARD_ZONES = [3, 4];
const EASY_ZONES = [0, 1];

interface PeakSlot {
  label: string;
  watts: number | undefined;
}

interface ZoneShare {
  zone: string;
  color: string;
  seconds: number;
}

export interface MoreStats {
  sport: Sport;
  calories?: EnergyEstimate | EnergyBlocked;
  movingTime?: { movingS: number; elapsedS: number; stoppedS: number };
  work?: { kj: number; avgPower: number | undefined };
  intensity?: { factor: number; np: number; ftp: number };
  variability?: { index: number; np: number; avgPower: number };
  peaks?: { slots: PeakSlot[]; highlight: number; ftp: number | undefined };
  coasting?: { seconds: number; share: number };
  stepLength?: { metres: number; stepsPerMinute: number; paceSecPerKm: number | undefined };
  hrZones?: {
    zones: ZoneShare[];
    dominant: number;
    totalSeconds: number;
    hardSeconds: number;
    easySeconds: number;
  };
  decoupling?: Decoupling;
}

const buildPeaks = (records: SessionRecord[], ftp: number | undefined): MoreStats['peaks'] => {
  const peaks = extractPeakPower(records);
  const slots = PEAK_WINDOWS.map((w) => ({ label: w.label, watts: peaks.get(w.seconds) }));
  if (slots[0]?.watts === undefined) return undefined;
  let highlight = PEAK_WINDOWS.findIndex((w) => w.seconds === HIGHLIGHT_PEAK_SECONDS);
  if (slots[highlight]?.watts === undefined) {
    highlight = slots.findLastIndex((slot) => slot.watts !== undefined);
  }
  return { slots, highlight, ftp };
};

const hasMovingPair = (records: SessionRecord[]): boolean =>
  records.some((current, i) => {
    const previous = records[i - 1];
    if (!previous) return false;
    return isMovingPair(previous, current);
  });

const sumAt = (seconds: number[], indices: number[]): number =>
  indices.reduce((sum, i) => sum + (seconds[i] ?? 0), 0);

const buildHrZones = (
  records: SessionRecord[],
  thresholds: ResolvedThresholds | undefined,
): MoreStats['hrZones'] => {
  if (!thresholds) return undefined;
  const scale = zoneScale('hr', thresholds);
  if (!scale) return undefined;
  const seconds = secondsInZones(
    records,
    (hr) => scale.bands.indexOf(scale.bandAt(hr)),
    scale.bands.length,
  );
  const totalSeconds = seconds.reduce((sum, value) => sum + value, 0);
  if (totalSeconds === 0) return undefined;
  let dominant = 0;
  seconds.forEach((value, i) => {
    if (value > (seconds[dominant] ?? 0)) dominant = i;
  });
  return {
    zones: scale.bands.map((band, i) => ({
      zone: band.zone,
      color: band.color,
      seconds: seconds[i] ?? 0,
    })),
    dominant,
    totalSeconds,
    hardSeconds: sumAt(seconds, HARD_ZONES),
    easySeconds: sumAt(seconds, EASY_ZONES),
  };
};

const buildStepLength = (
  session: TrainingSession,
  records: SessionRecord[],
  movingS: number | undefined,
): MoreStats['stepLength'] => {
  if (session.sport !== 'running') return undefined;
  const step = stepLength(records);
  if (!step) return undefined;
  let paceSecPerKm: number | undefined = undefined;
  if (session.distance !== undefined && session.distance > 0 && movingS !== undefined) {
    paceSecPerKm = movingS / (session.distance / 1000);
  }
  return { metres: step.metres, stepsPerMinute: step.stepsPerMinute, paceSecPerKm };
};

const buildCoasting = (
  records: SessionRecord[],
  movingS: number | undefined,
): MoreStats['coasting'] => {
  const seconds = coastingSeconds(records);
  if (seconds === undefined || movingS === undefined || movingS <= 0) return undefined;
  if (!hasMovingPair(records)) return undefined;
  return { seconds, share: Math.min(1, seconds / movingS) };
};

const buildWork = (records: SessionRecord[]): MoreStats['work'] => {
  const kj = sessionWorkKj(records);
  if (kj === undefined) return undefined;
  return { kj, avgPower: timeWeightedMean(records, 'power') };
};

const buildIntensity = (
  np: number | undefined,
  ftp: number | undefined,
): MoreStats['intensity'] => {
  if (np === undefined || ftp === undefined) return undefined;
  const factor = intensityFactor(np, ftp);
  if (factor === undefined) return undefined;
  return { factor, np, ftp };
};

const buildVariability = (
  np: number | undefined,
  avgPower: number | undefined,
): MoreStats['variability'] => {
  if (np === undefined || avgPower === undefined) return undefined;
  const index = variabilityIndex(np, avgPower);
  if (index === undefined) return undefined;
  return { index, np, avgPower };
};

const positiveFtp = (ftp: number | undefined): number | undefined => {
  if (ftp === undefined || ftp <= 0) return undefined;
  return ftp;
};

export const buildMoreStats = (
  session: TrainingSession,
  records: SessionRecord[],
  thresholds: ResolvedThresholds | undefined,
): MoreStats => {
  const gradients = windowedGradients(records);
  const stats: MoreStats = { sport: session.sport };

  stats.calories = estimateSessionEnergy(
    records,
    session.sport,
    { weightKg: thresholds?.weightKg, age: thresholds?.age, gender: thresholds?.gender ?? 'other' },
    gradients,
  );

  const moving = sessionMovingTime(records);
  if (moving) {
    stats.movingTime = {
      movingS: moving.movingS,
      elapsedS: moving.elapsedS,
      stoppedS: Math.max(0, moving.elapsedS - moving.movingS),
    };
  }

  if (session.sport === 'cycling') {
    stats.work = buildWork(records);
    stats.intensity = buildIntensity(session.normalizedPower, thresholds?.ftp);
    stats.variability = buildVariability(session.normalizedPower, session.avgPower);
    stats.peaks = buildPeaks(records, positiveFtp(thresholds?.ftp));
    stats.coasting = buildCoasting(records, moving?.movingS);
  }
  stats.stepLength = buildStepLength(session, records, moving?.movingS);
  stats.hrZones = buildHrZones(records, thresholds);

  const decoupling = aerobicDecoupling(records, session.sport, gradients);
  if (decoupling) stats.decoupling = decoupling;

  return stats;
};

const TOPIC_ORDER: MoreStatsTopic[] = ['calories', 'power', 'stride', 'zones', 'decoupling'];

const topicPresent = (stats: MoreStats, topic: MoreStatsTopic): boolean => {
  if (topic === 'calories') return stats.calories !== undefined;
  if (topic === 'power') {
    return [stats.work, stats.intensity, stats.variability, stats.peaks, stats.coasting].some(
      (cell) => cell !== undefined,
    );
  }
  if (topic === 'stride') return stats.stepLength !== undefined;
  if (topic === 'zones') return stats.hrZones !== undefined;
  return stats.decoupling !== undefined;
};

export const moreStatsTopics = (stats: MoreStats): MoreStatsTopic[] =>
  TOPIC_ORDER.filter((topic) => topicPresent(stats, topic));

interface PeakScale {
  bars: Array<number | undefined>;
  ftpLine: number | undefined;
}

export const peakScale = (
  watts: Array<number | undefined>,
  ftp: number | undefined,
  heightPx: number,
): PeakScale => {
  const known = watts.filter((w): w is number => w !== undefined);
  const hi = Math.max(0, ...known);
  if (hi <= 0) {
    let ftpLine: number | undefined = undefined;
    if (ftp !== undefined) ftpLine = heightPx;
    return {
      bars: watts.map((w) => {
        if (w === undefined) return undefined;
        return 0;
      }),
      ftpLine,
    };
  }
  const positive = known.filter((w) => w > 0);
  let lo = Math.min(...positive) / 2;
  if (ftp !== undefined) lo = Math.min(lo, ftp / 2);
  const heightOf = (value: number): number => {
    if (value <= 0) return 0;
    const height = (heightPx * Math.log(value / lo)) / Math.log(hi / lo);
    return Math.max(0, Math.min(heightPx, height));
  };
  let ftpLine: number | undefined = undefined;
  if (ftp !== undefined) ftpLine = heightOf(ftp);
  return {
    bars: watts.map((w) => {
      if (w === undefined) return undefined;
      return heightOf(w);
    }),
    ftpLine,
  };
};
