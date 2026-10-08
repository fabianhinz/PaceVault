import { m } from '@/paraglide/messages.js';
import type { ZoneBand } from '@/lib/zoneColors.ts';

const ZONE_NAME_LABELS: Record<string, () => string> = {
  recovery: m.ui_zone_recovery,
  easy: m.ui_zone_easy,
  tempo: m.ui_zone_tempo,
  threshold: m.ui_zone_threshold,
  vo2max: m.ui_zone_vo2max,
  aerobic: m.ui_zone_aerobic,
  active_recovery: m.ui_zone_active_recovery,
  endurance: m.ui_zone_endurance,
  anaerobic: m.ui_zone_anaerobic,
  neuromuscular: m.ui_zone_neuromuscular,
};

export const zoneLabel = (band: ZoneBand): string => {
  const translate = ZONE_NAME_LABELS[band.name];
  if (!translate) return band.zone;
  return `${band.zone} ${translate()}`;
};
