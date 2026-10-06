import type { SessionRecord, Sport } from '@/packages/engine/types.ts';
import type { WindSample } from '@/packages/engine/windExposure.ts';
import { zoneScale, type ZoneMetric, type ZoneThresholds } from '@/lib/zoneColors.ts';

export type ColorMode = 'sport' | ZoneMetric | 'wind';

export const COLOR_MODES: ColorMode[] = ['sport', 'hr', 'power', 'pace', 'wind'];

export type ColorModeUnavailableReason =
  | 'hrThresholds'
  | 'ftp'
  | 'thresholdPace'
  | 'runningOnly'
  | 'noHrData'
  | 'noPowerData'
  | 'noPaceData'
  | 'noWeather'
  | 'weatherLoading'
  | 'noGps';

export type ColorModeStatus =
  | { available: true }
  | { available: false; reason: ColorModeUnavailableReason };

export type WindInput = { state: 'loading' } | { state: 'ready'; samples: WindSample[] };

interface ColorModeInput {
  sport: Sport;
  records: SessionRecord[];
  thresholds: ZoneThresholds;
  wind: WindInput;
}

const AVAILABLE: ColorModeStatus = { available: true };

const unavailable = (reason: ColorModeUnavailableReason): ColorModeStatus => ({
  available: false,
  reason,
});

const hasValue = (records: SessionRecord[], read: (r: SessionRecord) => number | undefined) =>
  records.some((r) => read(r) !== undefined);

const gpsPointCount = (records: SessionRecord[]): number =>
  records.filter((r) => r.lat !== undefined && r.lng !== undefined).length;

const zoneStatus = (
  metric: ZoneMetric,
  thresholds: ZoneThresholds,
  hasData: boolean,
  thresholdReason: ColorModeUnavailableReason,
  dataReason: ColorModeUnavailableReason,
): ColorModeStatus => {
  if (!hasData) return unavailable(dataReason);
  if (!zoneScale(metric, thresholds)) return unavailable(thresholdReason);
  return AVAILABLE;
};

const paceStatus = (input: ColorModeInput): ColorModeStatus => {
  if (input.sport !== 'running') return unavailable('runningOnly');
  const hasPace = input.records.some((r) => r.speed !== undefined && r.speed > 0);
  return zoneStatus('pace', input.thresholds, hasPace, 'thresholdPace', 'noPaceData');
};

const windStatus = (input: ColorModeInput): ColorModeStatus => {
  if (gpsPointCount(input.records) < 2) return unavailable('noGps');
  if (input.wind.state === 'loading') return unavailable('weatherLoading');
  if (input.wind.samples.length === 0) return unavailable('noWeather');
  return AVAILABLE;
};

export const colorModeStatuses = (input: ColorModeInput): Record<ColorMode, ColorModeStatus> => ({
  sport: AVAILABLE,
  hr: zoneStatus(
    'hr',
    input.thresholds,
    hasValue(input.records, (r) => r.hr),
    'hrThresholds',
    'noHrData',
  ),
  power: zoneStatus(
    'power',
    input.thresholds,
    hasValue(input.records, (r) => r.power),
    'ftp',
    'noPowerData',
  ),
  pace: paceStatus(input),
  wind: windStatus(input),
});

export const effectiveColorMode = (
  stored: ColorMode,
  statuses: Record<ColorMode, ColorModeStatus>,
): ColorMode => {
  if (statuses[stored].available) return stored;
  return 'sport';
};
