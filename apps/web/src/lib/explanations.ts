import { m } from '@pacevault/i18n/messages.js';

export type MetricId =
  | 'tss'
  | 'trimp'
  | 'duration'
  | 'tripLoad'
  | 'ctl'
  | 'atl'
  | 'tsb'
  | 'acwr'
  | 'normalizedPower'
  | 'gradeAdjustedPace'
  | 'recovery'
  | 'trainingZones'
  | 'aerobicTE'
  | 'anaerobicTE'
  | 'avgHr'
  | 'avgPace'
  | 'avgSpeed'
  | 'avgPower'
  | 'elevation'
  | 'vam'
  | 'cadence'
  | 'vdot'
  | 'calories'
  | 'movingTime'
  | 'decoupling'
  | 'intensityFactor'
  | 'variabilityIndex'
  | 'peakPower'
  | 'stepLength';

export interface MetricExplanation {
  id: MetricId;
  shortLabel?: string;
  friendlyName: string;
  oneLiner: string;
  range: string;
  sports: ('running' | 'cycling' | 'all')[];
}

const tss: MetricExplanation = {
  id: 'tss',
  shortLabel: m.exp_tss_shortLabel(),
  friendlyName: m.exp_tss_friendlyName(),
  oneLiner: m.exp_tss_oneLiner(),
  range: m.exp_tss_range(),
  sports: ['cycling'],
};

const trimp: MetricExplanation = {
  id: 'trimp',
  shortLabel: m.exp_trimp_shortLabel(),
  friendlyName: m.exp_trimp_friendlyName(),
  oneLiner: m.exp_trimp_oneLiner(),
  range: m.exp_trimp_range(),
  sports: ['all'],
};

const duration: MetricExplanation = {
  id: 'duration',
  shortLabel: m.exp_duration_shortLabel(),
  friendlyName: m.exp_duration_friendlyName(),
  oneLiner: m.exp_duration_oneLiner(),
  range: m.exp_duration_range(),
  sports: ['all'],
};

const tripLoad: MetricExplanation = {
  id: 'tripLoad',
  friendlyName: m.exp_tripLoad_friendlyName(),
  oneLiner: m.exp_tripLoad_oneLiner(),
  range: m.exp_tripLoad_range(),
  sports: ['all'],
};

const ctl: MetricExplanation = {
  id: 'ctl',
  shortLabel: m.exp_ctl_shortLabel(),
  friendlyName: m.exp_ctl_friendlyName(),
  oneLiner: m.exp_ctl_oneLiner(),
  range: m.exp_ctl_range(),
  sports: ['all'],
};

const atl: MetricExplanation = {
  id: 'atl',
  shortLabel: m.exp_atl_shortLabel(),
  friendlyName: m.exp_atl_friendlyName(),
  oneLiner: m.exp_atl_oneLiner(),
  range: m.exp_atl_range(),
  sports: ['all'],
};

const tsb: MetricExplanation = {
  id: 'tsb',
  shortLabel: m.exp_tsb_shortLabel(),
  friendlyName: m.exp_tsb_friendlyName(),
  oneLiner: m.exp_tsb_oneLiner(),
  range: m.exp_tsb_range(),
  sports: ['all'],
};

const acwr: MetricExplanation = {
  id: 'acwr',
  shortLabel: m.exp_acwr_shortLabel(),
  friendlyName: m.exp_acwr_friendlyName(),
  oneLiner: m.exp_acwr_oneLiner(),
  range: m.exp_acwr_range(),
  sports: ['all'],
};

const normalizedPower: MetricExplanation = {
  id: 'normalizedPower',
  shortLabel: m.exp_normalizedPower_shortLabel(),
  friendlyName: m.exp_normalizedPower_friendlyName(),
  oneLiner: m.exp_normalizedPower_oneLiner(),
  range: m.exp_normalizedPower_range(),
  sports: ['cycling'],
};

const gradeAdjustedPace: MetricExplanation = {
  id: 'gradeAdjustedPace',
  shortLabel: m.exp_gradeAdjustedPace_shortLabel(),
  friendlyName: m.exp_gradeAdjustedPace_friendlyName(),
  oneLiner: m.exp_gradeAdjustedPace_oneLiner(),
  range: m.exp_gradeAdjustedPace_range(),
  sports: ['running'],
};

const recovery: MetricExplanation = {
  id: 'recovery',
  shortLabel: m.exp_recovery_shortLabel(),
  friendlyName: m.exp_recovery_friendlyName(),
  oneLiner: m.exp_recovery_oneLiner(),
  range: m.exp_recovery_range(),
  sports: ['all'],
};

const trainingZones: MetricExplanation = {
  id: 'trainingZones',
  shortLabel: m.exp_trainingZones_shortLabel(),
  friendlyName: m.exp_trainingZones_friendlyName(),
  oneLiner: m.exp_trainingZones_oneLiner(),
  range: m.exp_trainingZones_range(),
  sports: ['all'],
};

const aerobicTE: MetricExplanation = {
  id: 'aerobicTE',
  shortLabel: m.exp_aerobicTE_shortLabel(),
  friendlyName: m.exp_aerobicTE_friendlyName(),
  oneLiner: m.exp_aerobicTE_oneLiner(),
  range: m.exp_aerobicTE_range(),
  sports: ['all'],
};

const anaerobicTE: MetricExplanation = {
  id: 'anaerobicTE',
  shortLabel: m.exp_anaerobicTE_shortLabel(),
  friendlyName: m.exp_anaerobicTE_friendlyName(),
  oneLiner: m.exp_anaerobicTE_oneLiner(),
  range: m.exp_anaerobicTE_range(),
  sports: ['all'],
};

const avgHr: MetricExplanation = {
  id: 'avgHr',
  shortLabel: m.exp_avgHr_shortLabel(),
  friendlyName: m.exp_avgHr_friendlyName(),
  oneLiner: m.exp_avgHr_oneLiner(),
  range: m.exp_avgHr_range(),
  sports: ['all'],
};

const avgPace: MetricExplanation = {
  id: 'avgPace',
  shortLabel: m.exp_avgPace_shortLabel(),
  friendlyName: m.exp_avgPace_friendlyName(),
  oneLiner: m.exp_avgPace_oneLiner(),
  range: m.exp_avgPace_range(),
  sports: ['running'],
};

const avgSpeed: MetricExplanation = {
  id: 'avgSpeed',
  shortLabel: m.exp_avgSpeed_shortLabel(),
  friendlyName: m.exp_avgSpeed_friendlyName(),
  oneLiner: m.exp_avgSpeed_oneLiner(),
  range: m.exp_avgSpeed_range(),
  sports: ['cycling'],
};

const avgPower: MetricExplanation = {
  id: 'avgPower',
  shortLabel: m.exp_avgPower_shortLabel(),
  friendlyName: m.exp_avgPower_friendlyName(),
  oneLiner: m.exp_avgPower_oneLiner(),
  range: m.exp_avgPower_range(),
  sports: ['cycling'],
};

const elevation: MetricExplanation = {
  id: 'elevation',
  shortLabel: m.exp_elevation_shortLabel(),
  friendlyName: m.exp_elevation_friendlyName(),
  oneLiner: m.exp_elevation_oneLiner(),
  range: m.exp_elevation_range(),
  sports: ['all'],
};

const vam: MetricExplanation = {
  id: 'vam',
  friendlyName: m.exp_vam_friendlyName(),
  oneLiner: m.exp_vam_oneLiner(),
  range: m.exp_vam_range(),
  sports: ['all'],
};

const cadence: MetricExplanation = {
  id: 'cadence',
  shortLabel: m.exp_cadence_shortLabel(),
  friendlyName: m.exp_cadence_friendlyName(),
  oneLiner: m.exp_cadence_oneLiner(),
  range: m.exp_cadence_range(),
  sports: ['all'],
};

const vdot: MetricExplanation = {
  id: 'vdot',
  shortLabel: m.exp_vdot_shortLabel(),
  friendlyName: m.exp_vdot_friendlyName(),
  oneLiner: m.exp_vdot_oneLiner(),
  range: m.exp_vdot_range(),
  sports: ['running'],
};

const calories: MetricExplanation = {
  id: 'calories',
  shortLabel: m.exp_calories_shortLabel(),
  friendlyName: m.exp_calories_friendlyName(),
  oneLiner: m.exp_calories_oneLiner(),
  range: m.exp_calories_range(),
  sports: ['all'],
};

const movingTime: MetricExplanation = {
  id: 'movingTime',
  shortLabel: m.exp_movingTime_shortLabel(),
  friendlyName: m.exp_movingTime_friendlyName(),
  oneLiner: m.exp_movingTime_oneLiner(),
  range: m.exp_movingTime_range(),
  sports: ['all'],
};

const decoupling: MetricExplanation = {
  id: 'decoupling',
  shortLabel: m.exp_decoupling_shortLabel(),
  friendlyName: m.exp_decoupling_friendlyName(),
  oneLiner: m.exp_decoupling_oneLiner(),
  range: m.exp_decoupling_range(),
  sports: ['all'],
};

const intensityFactor: MetricExplanation = {
  id: 'intensityFactor',
  shortLabel: m.exp_intensityFactor_shortLabel(),
  friendlyName: m.exp_intensityFactor_friendlyName(),
  oneLiner: m.exp_intensityFactor_oneLiner(),
  range: m.exp_intensityFactor_range(),
  sports: ['cycling'],
};

const variabilityIndex: MetricExplanation = {
  id: 'variabilityIndex',
  shortLabel: m.exp_variabilityIndex_shortLabel(),
  friendlyName: m.exp_variabilityIndex_friendlyName(),
  oneLiner: m.exp_variabilityIndex_oneLiner(),
  range: m.exp_variabilityIndex_range(),
  sports: ['cycling'],
};

const peakPower: MetricExplanation = {
  id: 'peakPower',
  shortLabel: m.exp_peakPower_shortLabel(),
  friendlyName: m.exp_peakPower_friendlyName(),
  oneLiner: m.exp_peakPower_oneLiner(),
  range: m.exp_peakPower_range(),
  sports: ['cycling'],
};

const stepLength: MetricExplanation = {
  id: 'stepLength',
  shortLabel: m.exp_stepLength_shortLabel(),
  friendlyName: m.exp_stepLength_friendlyName(),
  oneLiner: m.exp_stepLength_oneLiner(),
  range: m.exp_stepLength_range(),
  sports: ['running'],
};

export const METRIC_EXPLANATIONS: Record<MetricId, MetricExplanation> = {
  tss,
  trimp,
  duration,
  tripLoad,
  ctl,
  atl,
  tsb,
  acwr,
  normalizedPower,
  gradeAdjustedPace,
  recovery,
  trainingZones,
  aerobicTE,
  anaerobicTE,
  avgHr,
  avgPace,
  avgSpeed,
  avgPower,
  elevation,
  vam,
  cadence,
  vdot,
  calories,
  movingTime,
  decoupling,
  intensityFactor,
  variabilityIndex,
  peakPower,
  stepLength,
};
