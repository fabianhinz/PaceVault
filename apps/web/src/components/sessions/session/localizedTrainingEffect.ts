import { m } from '@pacevault/i18n/messages.js';
import type {
  TrainingEffectLabel,
  TrainingEffectSummary,
} from '@pacevault/engine/trainingEffect.ts';

const LABEL_BY_TRAINING_EFFECT: Record<TrainingEffectLabel, () => string> = {
  overreaching: m.ui_te_effect_overreaching,
  highly_improving: m.ui_te_effect_highly_improving,
  improving: m.ui_te_effect_improving,
  maintaining: m.ui_te_effect_maintaining,
  minor: m.ui_te_effect_minor,
  no_effect: m.ui_te_effect_no_effect,
};

const TEXT_BY_TRAINING_EFFECT_SUMMARY: Record<TrainingEffectSummary, () => string> = {
  too_easy: m.ui_te_summary_too_easy,
  extreme: m.ui_te_summary_extreme,
  steady_aerobic: m.ui_te_summary_steady_aerobic,
  high_intensity: m.ui_te_summary_high_intensity,
  mixed_intensity: m.ui_te_summary_mixed_intensity,
  easy_maintenance: m.ui_te_summary_easy_maintenance,
  moderate: m.ui_te_summary_moderate,
  light: m.ui_te_summary_light,
};

export const localizedTELabel = (key: TrainingEffectLabel): string =>
  LABEL_BY_TRAINING_EFFECT[key]();

export const localizedTESummary = (key: TrainingEffectSummary): string =>
  `${TEXT_BY_TRAINING_EFFECT_SUMMARY[key]()} ${m.ui_te_from_hr()}`;
