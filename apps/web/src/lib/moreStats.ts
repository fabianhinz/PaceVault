import type { SessionRecord, Sport, TrainingSession } from '@pacevault/engine/types.ts';
import { windowedGradients } from '@pacevault/engine/gradient.ts';
import { isMovingPair } from '@pacevault/engine/normalize.ts';
import { intensityFactor, variabilityIndex } from '@pacevault/engine/stress.ts';
import { coastingSeconds, stepLength } from '@pacevault/engine/cadence.ts';
import { secondsInZones } from '@pacevault/engine/zoneDistribution.ts';
import { aerobicDecoupling, type Decoupling } from '@pacevault/engine/decoupling.ts';
import {
  estimateSessionEnergy,
  type EnergyBlocked,
  type EnergyEstimate,
} from '@pacevault/engine/energy.ts';
import { extractPeakPower } from './records.ts';
import { sessionMovingTime } from './movingTime.ts';
import { zoneScale } from './zoneColors.ts';
import type { ResolvedThresholds } from './thresholdsAt.ts';

export type MoreStatsTopic = 'load' | 'calories' | 'power' | 'stride' | 'zones';

export const PEAK_WINDOW_SECONDS = [5, 60, 300, 1200, 3600] as const;

const HIGHLIGHT_PEAK_SECONDS = 1200;

interface PeakSlot {
  seconds: number;
  watts: number | undefined;
}

interface ZoneShare {
  zone: string;
  name: string;
  color: string;
  seconds: number;
}

export interface MoreStats {
  sport: Sport;
  calories?: EnergyEstimate | EnergyBlocked;
  movingTime?: {
    movingS: number;
    elapsedS: number;
    stoppedS: number;
    coastingS: number | undefined;
  };
  intensity?: { factor: number };
  variability?: { index: number; np: number; avgPower: number };
  peaks?: { slots: PeakSlot[]; highlight: number };
  stepLength?: { metres: number; stepsPerMinute: number };
  hrZones?: {
    zones: ZoneShare[];
    dominant: number;
    totalSeconds: number;
  };
  decoupling?: Decoupling;
}

const buildPeaks = (records: SessionRecord[]): MoreStats['peaks'] => {
  const peaks = extractPeakPower(records);
  const slots = PEAK_WINDOW_SECONDS.map((seconds) => ({ seconds, watts: peaks.get(seconds) }));
  if (slots[0]?.watts === undefined) return undefined;
  let highlight = PEAK_WINDOW_SECONDS.findIndex((seconds) => seconds === HIGHLIGHT_PEAK_SECONDS);
  if (slots[highlight]?.watts === undefined) {
    highlight = slots.findLastIndex((slot) => slot.watts !== undefined);
  }
  return { slots, highlight };
};

const hasMovingPair = (records: SessionRecord[]): boolean =>
  records.some((current, i) => {
    const previous = records[i - 1];
    if (!previous) return false;
    return isMovingPair(previous, current);
  });

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
      name: band.name,
      color: band.color,
      seconds: seconds[i] ?? 0,
    })),
    dominant,
    totalSeconds,
  };
};

const buildStepLength = (
  session: TrainingSession,
  records: SessionRecord[],
): MoreStats['stepLength'] => {
  if (session.sport !== 'running') return undefined;
  const step = stepLength(records);
  if (!step) return undefined;
  return { metres: step.metres, stepsPerMinute: step.stepsPerMinute };
};

const buildCoasting = (session: TrainingSession, records: SessionRecord[]): number | undefined => {
  if (session.sport !== 'cycling') return undefined;
  if (!hasMovingPair(records)) return undefined;
  return coastingSeconds(records);
};

const buildIntensity = (
  np: number | undefined,
  ftp: number | undefined,
): MoreStats['intensity'] => {
  if (np === undefined || ftp === undefined) return undefined;
  const factor = intensityFactor(np, ftp);
  if (factor === undefined) return undefined;
  return { factor };
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
    { weightKg: thresholds?.weightKg, age: thresholds?.age, gender: thresholds?.gender },
    gradients,
  );

  const moving = sessionMovingTime(records);
  if (moving) {
    stats.movingTime = {
      movingS: moving.movingS,
      elapsedS: moving.elapsedS,
      stoppedS: Math.max(0, moving.elapsedS - moving.movingS),
      coastingS: buildCoasting(session, records),
    };
  }

  if (session.sport === 'cycling') {
    stats.intensity = buildIntensity(session.normalizedPower, thresholds?.ftp);
    stats.variability = buildVariability(session.normalizedPower, session.avgPower);
    stats.peaks = buildPeaks(records);
  }
  stats.stepLength = buildStepLength(session, records);
  stats.hrZones = buildHrZones(records, thresholds);

  const decoupling = aerobicDecoupling(records, session.sport, gradients);
  if (decoupling) stats.decoupling = decoupling;

  return stats;
};

const TOPIC_ORDER: MoreStatsTopic[] = ['load', 'calories', 'power', 'stride', 'zones'];

const topicPresent = (stats: MoreStats, topic: MoreStatsTopic): boolean => {
  if (topic === 'load') return true;
  if (topic === 'calories') return stats.calories !== undefined;
  if (topic === 'power') {
    return [stats.intensity, stats.variability, stats.peaks].some((cell) => cell !== undefined);
  }
  if (topic === 'stride') return stats.stepLength !== undefined;
  return stats.hrZones !== undefined;
};

export const moreStatsTopics = (stats: MoreStats): MoreStatsTopic[] =>
  TOPIC_ORDER.filter((topic) => topicPresent(stats, topic));

export const peakScale = (
  watts: Array<number | undefined>,
  heightPx: number,
): Array<number | undefined> => {
  const known = watts.filter((w): w is number => w !== undefined);
  const hi = Math.max(0, ...known);
  const positive = known.filter((w) => w > 0);
  const lo = Math.min(...positive) / 2;
  return watts.map((w) => {
    if (w === undefined) return undefined;
    if (w <= 0) return 0;
    const height = (heightPx * Math.log(w / lo)) / Math.log(hi / lo);
    return Math.max(0, Math.min(heightPx, height));
  });
};

interface RailPick {
  index: number;
  active: boolean;
}

interface PeakPick extends RailPick {
  seconds: number;
  watts: number;
}

interface ZonePick extends RailPick {
  zone: ZoneShare;
  share: number;
}

const peakPickAt = (
  peaks: NonNullable<MoreStats['peaks']>,
  index: number,
  active: boolean,
): PeakPick | undefined => {
  const slot = peaks.slots[index];
  if (slot?.watts === undefined) return undefined;
  return { index, active, seconds: slot.seconds, watts: slot.watts };
};

export const pickPeak = (
  peaks: NonNullable<MoreStats['peaks']>,
  hovered: number | null,
): PeakPick | undefined => {
  if (hovered !== null) {
    const pick = peakPickAt(peaks, hovered, true);
    if (pick) return pick;
  }
  return peakPickAt(peaks, peaks.highlight, false);
};

const zonePickAt = (
  zones: NonNullable<MoreStats['hrZones']>,
  index: number,
  active: boolean,
): ZonePick | undefined => {
  const zone = zones.zones[index];
  if (!zone) return undefined;
  return { index, active, zone, share: zone.seconds / zones.totalSeconds };
};

export const pickZone = (
  zones: NonNullable<MoreStats['hrZones']>,
  hovered: number | null,
): ZonePick | undefined => {
  if (hovered !== null) {
    const pick = zonePickAt(zones, hovered, true);
    if (pick) return pick;
  }
  return zonePickAt(zones, zones.dominant, false);
};
