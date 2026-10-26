import { tokens } from '@pacevault/ui/lib/tokens.ts';
import { trainingEffectLabel, type TrainingEffectLabel } from '@pacevault/engine/trainingEffect.ts';

export const TE_ZONES = [
  { from: 0, to: 1, color: tokens.statusNeutral },
  { from: 1, to: 2, color: tokens.accent },
  { from: 2, to: 3, color: tokens.statusSuccessStrong },
  { from: 3, to: 4, color: tokens.statusWarningStrong },
  { from: 4, to: 5, color: tokens.chartCadence },
];

const FILL_BY_TRAINING_EFFECT_LABEL: Record<TrainingEffectLabel, string> = {
  no_effect: tokens.statusNeutral,
  minor: tokens.accent,
  maintaining: tokens.statusSuccessStrong,
  improving: tokens.statusWarningStrong,
  highly_improving: tokens.chartCadence,
  overreaching: tokens.statusDangerStrong,
};

export const fillOf = (value: number) => FILL_BY_TRAINING_EFFECT_LABEL[trainingEffectLabel(value)];
