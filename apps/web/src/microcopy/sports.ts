import { m } from '@pacevault/i18n/messages.js';
import type { Sport } from '@pacevault/engine/types.ts';

export const LABEL_BY_SPORT: Record<Sport, () => string> = {
  running: m.ui_sport_running,
  cycling: m.ui_sport_cycling,
};

export const RECORDS_SUBTITLE_BY_SPORT: Record<Sport, () => string> = {
  running: m.ui_records_running_subtitle,
  cycling: m.ui_records_cycling_subtitle,
};
