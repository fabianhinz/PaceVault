import type { SessionRecord, Sport } from '@pacevault/engine/types.ts';
import type { WindSample } from '@pacevault/engine/windExposure.ts';
import { zoneScale, type ZoneMetric, type ZoneThresholds } from '@/lib/zoneColors.ts';
import { hasMovingSpeed } from '@/lib/speedScale.ts';

export const COLOR_MODES = ['sport', 'hr', 'power', 'pace', 'speed', 'wind'] as const;
export type ColorMode = (typeof COLOR_MODES)[number];

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

const hasValue = ({
  records,
  read,
}: {
  records: SessionRecord[];
  read: (r: SessionRecord) => number | undefined;
}) => records.some((r) => read(r) !== undefined);

const gpsPointCount = (records: SessionRecord[]): number =>
  records.filter((r) => r.lat !== undefined && r.lng !== undefined).length;

const zoneStatus = ({
  metric,
  thresholds,
  dataPresent,
  thresholdReason,
  dataReason,
}: {
  metric: ZoneMetric;
  thresholds: ZoneThresholds;
  dataPresent: boolean;
  thresholdReason: ColorModeUnavailableReason;
  dataReason: ColorModeUnavailableReason;
}): ColorModeStatus => {
  if (!dataPresent) return unavailable(dataReason);
  if (!zoneScale({ metric, thresholds })) return unavailable(thresholdReason);
  return AVAILABLE;
};

const paceStatus = (input: ColorModeInput): ColorModeStatus =>
  zoneStatus({
    metric: 'pace',
    thresholds: input.thresholds,
    dataPresent: hasMovingSpeed(input.records),
    thresholdReason: 'thresholdPace',
    dataReason: 'noPaceData',
  });

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
    status: zoneStatus({
      metric: 'hr',
      thresholds: input.thresholds,
      dataPresent: hasValue({ records: input.records, read: (r) => r.hr }),
      thresholdReason: 'hrThresholds',
      dataReason: 'noHrData',
    }),
  },
  {
    mode: 'power',
    status: zoneStatus({
      metric: 'power',
      thresholds: input.thresholds,
      dataPresent: hasValue({ records: input.records, read: (r) => r.power }),
      thresholdReason: 'ftp',
      dataReason: 'noPowerData',
    }),
  },
  paceOrSpeed(input),
  { mode: 'wind', status: windStatus(input) },
];

export const effectiveColorMode = (stored: ColorMode, options: ColorModeOption[]): ColorMode => {
  const option = options.find((candidate) => candidate.mode === stored);
  if (option?.status.available) return stored;
  return 'sport';
};
