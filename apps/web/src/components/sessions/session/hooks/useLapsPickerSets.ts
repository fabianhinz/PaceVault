import { useMemo } from 'react';
import {
  buildDeviceLapSet,
  buildEffortLapSet,
  buildLapSet,
  type LapSet,
  type LapSource,
} from '@/lib/analysis/laps.ts';
import { useThresholdsAt } from '@/components/settings/hooks/useThresholdsAt.ts';
import type { EffortLimiter } from '@pacevault/engine/effortDetection.ts';
import type { SessionLap, SessionRecord, Sport } from '@pacevault/engine/types.ts';

interface LapsPickerSets {
  deviceSet: LapSet | null;
  splitSet: LapSet | null;
  effortSet: LapSet | null;
  limitedBy: EffortLimiter | undefined;
}

export const useLapsPickerSets = ({
  source,
  records,
  laps,
  current,
  splitDistance,
  sport,
  date,
}: {
  source: LapSource;
  records: SessionRecord[];
  laps: SessionLap[];
  current: LapSet | null;
  splitDistance: number;
  sport: Sport;
  date: number;
}): LapsPickerSets => {
  const deviceSource = source === 'device';
  const builtDeviceSet = useMemo(() => {
    if (deviceSource) return null;
    return buildDeviceLapSet({ records, laps });
  }, [deviceSource, records, laps]);
  let deviceSet = builtDeviceSet;
  if (deviceSource) deviceSet = current;
  const thresholds = useThresholdsAt(date);
  const splitSet = useMemo(() => {
    if (source === 'splits') return current;
    return buildLapSet({
      records,
      laps,
      source: 'splits',
      splitDistance,
      effortContext: { sport, thresholds: undefined },
    });
  }, [source, current, records, laps, splitDistance, sport]);
  const effortResult = useMemo(() => {
    if (source === 'efforts' && current?.efforts) {
      return { set: current, limitedBy: current.efforts.limitedBy };
    }
    return buildEffortLapSet({ records, sport, thresholds });
  }, [source, current, records, sport, thresholds]);
  return { deviceSet, splitSet, effortSet: effortResult.set, limitedBy: effortResult.limitedBy };
};
