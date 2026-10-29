import { m } from '@pacevault/i18n/messages.js';
import type { RunningZoneName } from '@pacevault/engine/types.ts';

export const LABEL_BY_RUNNING_ZONE: Record<RunningZoneName, () => string> = {
  recovery: m.ui_zone_recovery,
  easy: m.ui_zone_easy,
  tempo: m.ui_zone_tempo,
  threshold: m.ui_zone_threshold,
  vo2max: m.ui_zone_vo2max,
};
