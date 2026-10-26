import { m } from '@pacevault/i18n/messages.js';
import type { DailyMetrics, FormStatus, InjuryRisk } from '@pacevault/engine/types.ts';
import type { CoachingRecommendation } from '@/types.ts';
import {
  formStatusFromTsb,
  injuryRiskFromAcwr,
  loadStateFromAcwr,
} from '@pacevault/engine/coaching.ts';

export const getFormMessage = (status: FormStatus): string => {
  switch (status) {
    case 'detraining':
      return m.coach_form_detraining();
    case 'fresh':
      return m.coach_form_fresh();
    case 'neutral':
      return m.coach_form_neutral();
    case 'optimal':
      return m.coach_form_optimal();
    case 'overload':
      return m.coach_form_overload();
  }
};

// ---------------------------------------------------------------------------
// ACWR-aware detailed messages
// ---------------------------------------------------------------------------

const IMMATURE_MESSAGES: Record<FormStatus, () => string> = {
  detraining: m.coach_immature_detraining,
  fresh: m.coach_immature_fresh,
  neutral: m.coach_immature_neutral,
  optimal: m.coach_immature_optimal,
  overload: m.coach_immature_overload,
};

const UNDERTRAINING_MESSAGES: Record<FormStatus, () => string> = {
  detraining: m.coach_undertraining_detraining,
  fresh: m.coach_undertraining_fresh,
  neutral: m.coach_undertraining_neutral,
  optimal: m.coach_undertraining_optimal,
  overload: m.coach_undertraining_overload,
};

const SWEET_SPOT_MESSAGES: Record<FormStatus, () => string> = {
  detraining: m.coach_sweet_detraining,
  fresh: m.coach_sweet_fresh,
  neutral: m.coach_sweet_neutral,
  optimal: m.coach_sweet_optimal,
  overload: m.coach_sweet_overload,
};

const RISK_MESSAGES: Record<FormStatus, Record<Exclude<InjuryRisk, 'low'>, () => string>> = {
  detraining: {
    moderate: m.coach_risk_mod_detraining,
    high: m.coach_risk_high_detraining,
  },
  fresh: {
    moderate: m.coach_risk_mod_fresh,
    high: m.coach_risk_high_fresh,
  },
  neutral: {
    moderate: m.coach_risk_mod_neutral,
    high: m.coach_risk_high_neutral,
  },
  optimal: {
    moderate: m.coach_risk_mod_optimal,
    high: m.coach_risk_high_optimal,
  },
  overload: {
    moderate: m.coach_risk_mod_overload,
    high: m.coach_risk_high_overload,
  },
};

export const getFormMessageDetailed = (rec: CoachingRecommendation): string => {
  const state = loadStateFromAcwr({ acwr: rec.acwr, dataMaturityDays: rec.dataMaturityDays });

  switch (state) {
    case 'immature':
    case 'transitioning':
      return IMMATURE_MESSAGES[rec.status]();
    case 'undertraining':
      return UNDERTRAINING_MESSAGES[rec.status]();
    case 'sweet-spot':
      return SWEET_SPOT_MESSAGES[rec.status]();
    case 'moderate-risk':
    case 'high-risk':
      return RISK_MESSAGES[rec.status][rec.injuryRisk as Exclude<InjuryRisk, 'low'>]();
  }
};

export const getCoachingRecommendation = ({
  metrics,
  historyDays,
}: {
  metrics: DailyMetrics | undefined;
  historyDays: number;
}): CoachingRecommendation => {
  if (!metrics) {
    return {
      status: 'neutral',
      message: m.coach_no_data(),
      tsb: 0,
      acwr: 0,
      injuryRisk: 'low',
      dataMaturityDays: historyDays,
    };
  }

  const status = formStatusFromTsb(metrics.tsb);
  const message = getFormMessage(status);
  const injuryRisk = injuryRiskFromAcwr(metrics.acwr);

  return {
    status,
    message,
    tsb: metrics.tsb,
    acwr: metrics.acwr,
    injuryRisk,
    dataMaturityDays: historyDays,
  };
};
