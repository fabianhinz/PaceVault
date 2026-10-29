import { m } from '@pacevault/i18n/messages.js';
import type { FormStatus, InjuryRisk } from '@pacevault/engine/types.ts';

export const LABEL_BY_FORM_STATUS: Record<FormStatus, () => string> = {
  detraining: m.ui_readiness_detraining,
  fresh: m.ui_readiness_fresh,
  neutral: m.ui_readiness_neutral,
  optimal: m.ui_readiness_optimal,
  overload: m.ui_readiness_overload,
};

export const LABEL_BY_INJURY_RISK: Record<InjuryRisk, () => string> = {
  low: m.ui_acwr_risk_low,
  moderate: m.ui_acwr_risk_moderate,
  high: m.ui_acwr_risk_high,
};
