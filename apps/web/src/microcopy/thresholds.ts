import { m } from '@pacevault/i18n/messages.js';
import type { ThresholdKey } from '@/types.ts';

export const ADD_CAPTION_BY_THRESHOLD: Record<ThresholdKey, () => string> = {
  restHr: m.ui_thresholds_add_rest_hr,
  maxHr: m.ui_thresholds_add_max_hr,
  thresholdHr: m.ui_thresholds_add_threshold_hr,
  ftp: m.ui_thresholds_add_ftp,
  weight: m.ui_thresholds_add_weight,
  thresholdPace: m.ui_thresholds_add_pace,
};

export const TITLE_BY_THRESHOLD_FIELD: Record<ThresholdKey, () => string> = {
  restHr: m.ui_thresholds_resting_hr,
  maxHr: m.ui_thresholds_max_hr,
  thresholdHr: m.ui_thresholds_threshold_hr,
  ftp: m.ui_thresholds_ftp,
  thresholdPace: m.ui_thresholds_threshold_pace,
  weight: m.ui_thresholds_weight,
};
