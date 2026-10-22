import { m } from '@pacevault/i18n/messages.js';
import type { TELabelKey, TESummaryKey } from '@pacevault/engine/trainingEffect.ts';

const TE_LABEL_MAP: Record<TELabelKey, () => string> = {
  overreaching: m.engine_te_overreaching,
  highly_improving: m.engine_te_highly_improving,
  improving: m.engine_te_improving,
  maintaining: m.engine_te_maintaining,
  minor: m.engine_te_minor,
  no_effect: m.engine_te_no_effect,
};

const TE_SUMMARY_MAP: Record<TESummaryKey, () => string> = {
  too_easy: m.engine_te_sum_too_easy,
  extreme: m.engine_te_sum_extreme,
  steady_aerobic: m.engine_te_sum_steady_aerobic,
  high_intensity: m.engine_te_sum_high_intensity,
  mixed_intensity: m.engine_te_sum_mixed_intensity,
  easy_maintenance: m.engine_te_sum_easy_maintenance,
  moderate: m.engine_te_sum_moderate,
  light: m.engine_te_sum_light,
};

export const localizedTELabel = (key: TELabelKey): string => TE_LABEL_MAP[key]();

export const localizedTESummary = (key: TESummaryKey): string =>
  `${TE_SUMMARY_MAP[key]()} ${m.ui_te_from_hr()}`;
