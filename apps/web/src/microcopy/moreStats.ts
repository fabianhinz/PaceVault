import { m } from '@pacevault/i18n/messages.js';
import type { EnergyBlocker } from '@pacevault/engine/energy.ts';
import type { TrainingSession } from '@pacevault/engine/types.ts';
import type { MoreStatsTopic } from '@/lib/analysis/moreStats.ts';

export const LABEL_BY_MORE_STATS_TOPIC: Record<MoreStatsTopic, () => string> = {
  load: m.ui_more_stats_topic_load,
  calories: m.ui_more_stats_topic_calories,
  power: m.ui_more_stats_topic_power,
  stride: m.ui_more_stats_topic_stride,
  zones: m.ui_more_stats_topic_zones,
};

export const LABEL_BY_STRESS_METHOD: Record<TrainingSession['stressMethod'], () => string> = {
  tss: m.ui_more_stats_load_from_power,
  trimp: m.ui_more_stats_load_from_hr,
  duration: m.ui_more_stats_load_from_duration,
};

export const LABEL_BY_ENERGY_BLOCKER: Record<EnergyBlocker, () => string> = {
  weight: m.ui_more_stats_add_weight,
  age: m.ui_more_stats_add_birth_year,
  weightAndAge: m.ui_more_stats_add_weight_birth_year,
};
