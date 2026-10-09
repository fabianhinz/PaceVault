import { m } from '@/paraglide/messages.js';
import { HR_ZONE_DEFS } from '@/packages/engine/zoneDistribution.ts';
import { formatDate } from '@/lib/formatters.ts';

const ZONE_LABEL_MAP: Record<string, () => string> = {
  recovery: m.ui_zone_recovery,
  aerobic: m.ui_zone_aerobic,
  tempo: m.ui_zone_tempo,
  threshold: m.ui_zone_threshold,
  vo2max: m.ui_zone_vo2max,
};

interface SessionNameInput {
  date: number;
  name?: string;
}

export const formatSessionName = (input: SessionNameInput): string => {
  return input.name ?? formatDate(input.date);
};

export const formatSessionZoneLabel = (
  avgHr: number | undefined,
  maxHr: number | undefined,
  restHr: number | undefined,
): string | undefined => {
  if (!avgHr || !maxHr || !restHr) {
    return undefined;
  }
  if (maxHr <= restHr || avgHr <= restHr) {
    return undefined;
  }
  const hrReserve = maxHr - restHr;
  const pct = (avgHr - restHr) / hrReserve;

  for (let i = HR_ZONE_DEFS.length - 1; i >= 0; i--) {
    const zoneDef = HR_ZONE_DEFS[i];
    if (!zoneDef) continue;
    if (pct >= zoneDef.minPct) {
      const labelFn = ZONE_LABEL_MAP[zoneDef.name];
      if (labelFn) {
        return labelFn();
      }
      return undefined;
    }
  }
  return undefined;
};
