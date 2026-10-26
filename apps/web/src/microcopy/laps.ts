import { m } from '@pacevault/i18n/messages.js';
import type { EffortLimiter } from '@pacevault/engine/effortDetection.ts';

export const NUDGE_BY_EFFORT_LIMITER: Record<
  EffortLimiter,
  { precise: () => string; detect: () => string }
> = {
  ftp: { precise: m.ui_laps_efforts_precise_ftp, detect: m.ui_laps_efforts_detect_ftp },
  thresholdPace: {
    precise: m.ui_laps_efforts_precise_threshold_pace,
    detect: m.ui_laps_efforts_detect_threshold_pace,
  },
};
