import type { SessionRecord, Sport } from '@/packages/engine/types.ts';
import type { WindSample } from '@/packages/engine/windExposure.ts';
import { zoneScale, type ZoneMetric, type ZoneThresholds } from '@/lib/zoneColors.ts';
import { hasMovingSpeed } from '@/lib/speedScale.ts';

export type ColorMode = 'sport' | ZoneMetric | 'speed' | 'wind';

export type ColorModeUnavailableReason =
  | 'hrThresholds'
  | 'ftp'
  | 'thresholdPace'
  | 'noHrData'
  | 'noPowerData'
  | 'noPaceData'
  | 'noSpeedData'
  | 'noWeather'
  | 'weatherLoading'
  | 'noGps';

export type ColorModeStatus =
  | { available: true }
  | { available: false; reason: ColorModeUnavailableReason };

export interface ColorModeOption {
  mode: ColorMode;
  status: ColorModeStatus;
}

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

const paceStatus = (input: ColorModeInput): ColorModeStatus =>
  zoneStatus(
    'pace',
    input.thresholds,
    hasMovingSpeed(input.records),
    'thresholdPace',
    'noPaceData',
  );

const speedStatus = (input: ColorModeInput): ColorModeStatus => {
  if (!hasMovingSpeed(input.records)) return unavailable('noSpeedData');
  return AVAILABLE;
};

const windStatus = (input: ColorModeInput): ColorModeStatus => {
  if (gpsPointCount(input.records) < 2) return unavailable('noGps');
  if (input.wind.state === 'loading') return unavailable('weatherLoading');
  if (input.wind.samples.length === 0) return unavailable('noWeather');
  return AVAILABLE;
};

const paceOrSpeed = (input: ColorModeInput): ColorModeOption => {
  if (input.sport === 'running') return { mode: 'pace', status: paceStatus(input) };
  return { mode: 'speed', status: speedStatus(input) };
};

export const colorModeOptions = (input: ColorModeInput): ColorModeOption[] => [
  { mode: 'sport', status: AVAILABLE },
  {
    mode: 'hr',
    status: zoneStatus(
      'hr',
      input.thresholds,
      hasValue(input.records, (r) => r.hr),
      'hrThresholds',
      'noHrData',
    ),
  },
  {
    mode: 'power',
    status: zoneStatus(
      'power',
      input.thresholds,
      hasValue(input.records, (r) => r.power),
      'ftp',
      'noPowerData',
    ),
  },
  paceOrSpeed(input),
  { mode: 'wind', status: windStatus(input) },
];

export const effectiveColorMode = (stored: ColorMode, options: ColorModeOption[]): ColorMode => {
  const option = options.find((candidate) => candidate.mode === stored);
  if (option?.status.available) return stored;
  return 'sport';
};
