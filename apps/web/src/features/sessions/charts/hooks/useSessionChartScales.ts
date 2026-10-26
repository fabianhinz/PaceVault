import { useMemo } from 'react';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { useThresholdsAt } from '@/features/settings/hooks/useThresholdsAt.ts';
import {
  zoneScale,
  type ZoneMetric,
  type ZoneScale,
  type ZoneThresholds,
} from '@/lib/zoneColors.ts';
import type { ColorMode } from '@/lib/colorModes.ts';
import { speedScale, type SpeedScale } from '@/lib/speedScale.ts';
import type { SessionRecord } from '@pacevault/engine/types.ts';

interface SessionChartScales {
  hrScale: ZoneScale | undefined;
  powerScale: ZoneScale | undefined;
  paceScale: ZoneScale | undefined;
  speedColorScale: SpeedScale | undefined;
}

const scaleFor = ({
  metric,
  trackColorMode,
  thresholds,
}: {
  metric: ZoneMetric;
  trackColorMode: ColorMode;
  thresholds: ZoneThresholds | undefined;
}): ZoneScale | undefined => {
  if (trackColorMode !== metric || !thresholds) return undefined;
  return zoneScale({ metric, thresholds });
};

export const useSessionChartScales = ({
  date,
  records,
}: {
  date: number;
  records: SessionRecord[];
}): SessionChartScales => {
  const trackColorMode = useMapControlsStore((s) => s.trackColorMode);
  const thresholds = useThresholdsAt(date);
  const hrScale = useMemo(
    () => scaleFor({ metric: 'hr', trackColorMode, thresholds }),
    [trackColorMode, thresholds],
  );
  const powerScale = useMemo(
    () => scaleFor({ metric: 'power', trackColorMode, thresholds }),
    [trackColorMode, thresholds],
  );
  const paceScale = useMemo(
    () => scaleFor({ metric: 'pace', trackColorMode, thresholds }),
    [trackColorMode, thresholds],
  );
  const speedColorScale = useMemo(() => {
    if (trackColorMode === 'speed') return speedScale(records);
    return undefined;
  }, [trackColorMode, records]);
  return { hrScale, powerScale, paceScale, speedColorScale };
};
