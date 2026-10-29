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
}

const tss: MetricExplanation = {
  id: 'tss',
  shortLabel: m.exp_tss_short_label(),
  friendlyName: m.exp_tss_friendly_name(),
  oneLiner: m.exp_tss_one_liner(),
  range: m.exp_tss_range(),
};

const trimp: MetricExplanation = {
  id: 'trimp',
  shortLabel: m.exp_trimp_short_label(),
  friendlyName: m.exp_trimp_friendly_name(),
  oneLiner: m.exp_trimp_one_liner(),
  range: m.exp_trimp_range(),
};

const duration: MetricExplanation = {
  id: 'duration',
  shortLabel: m.exp_duration_short_label(),
  friendlyName: m.exp_duration_friendly_name(),
  oneLiner: m.exp_duration_one_liner(),
  range: m.exp_duration_range(),
};

const tripLoad: MetricExplanation = {
  id: 'tripLoad',
  friendlyName: m.exp_trip_load_friendly_name(),
  oneLiner: m.exp_trip_load_one_liner(),
  range: m.exp_trip_load_range(),
};

const ctl: MetricExplanation = {
  id: 'ctl',
  shortLabel: m.exp_ctl_short_label(),
  friendlyName: m.exp_ctl_friendly_name(),
  oneLiner: m.exp_ctl_one_liner(),
  range: m.exp_ctl_range(),
};

const atl: MetricExplanation = {
  id: 'atl',
  shortLabel: m.exp_atl_short_label(),
  friendlyName: m.exp_atl_friendly_name(),
  oneLiner: m.exp_atl_one_liner(),
  range: m.exp_atl_range(),
};

const tsb: MetricExplanation = {
  id: 'tsb',
  shortLabel: m.exp_tsb_short_label(),
  friendlyName: m.exp_tsb_friendly_name(),
  oneLiner: m.exp_tsb_one_liner(),
  range: m.exp_tsb_range(),
};

const acwr: MetricExplanation = {
  id: 'acwr',
  shortLabel: m.exp_acwr_short_label(),
  friendlyName: m.exp_acwr_friendly_name(),
  oneLiner: m.exp_acwr_one_liner(),
  range: m.exp_acwr_range(),
};

const normalizedPower: MetricExplanation = {
  id: 'normalizedPower',
  shortLabel: m.exp_normalized_power_short_label(),
  friendlyName: m.exp_normalized_power_friendly_name(),
  oneLiner: m.exp_normalized_power_one_liner(),
  range: m.exp_normalized_power_range(),
};

const gradeAdjustedPace: MetricExplanation = {
  id: 'gradeAdjustedPace',
  shortLabel: m.exp_grade_adjusted_pace_short_label(),
  friendlyName: m.exp_grade_adjusted_pace_friendly_name(),
  oneLiner: m.exp_grade_adjusted_pace_one_liner(),
  range: m.exp_grade_adjusted_pace_range(),
};

const recovery: MetricExplanation = {
  id: 'recovery',
  shortLabel: m.exp_recovery_short_label(),
  friendlyName: m.exp_recovery_friendly_name(),
  oneLiner: m.exp_recovery_one_liner(),
  range: m.exp_recovery_range(),
};

const trainingZones: MetricExplanation = {
  id: 'trainingZones',
  shortLabel: m.exp_training_zones_short_label(),
  friendlyName: m.exp_training_zones_friendly_name(),
  oneLiner: m.exp_training_zones_one_liner(),
  range: m.exp_training_zones_range(),
};

const aerobicTE: MetricExplanation = {
  id: 'aerobicTE',
  shortLabel: m.exp_aerobic_te_short_label(),
  friendlyName: m.exp_aerobic_te_friendly_name(),
  oneLiner: m.exp_aerobic_te_one_liner(),
  range: m.exp_aerobic_te_range(),
};

const anaerobicTE: MetricExplanation = {
  id: 'anaerobicTE',
  shortLabel: m.exp_anaerobic_te_short_label(),
  friendlyName: m.exp_anaerobic_te_friendly_name(),
  oneLiner: m.exp_anaerobic_te_one_liner(),
  range: m.exp_anaerobic_te_range(),
};

const avgHr: MetricExplanation = {
  id: 'avgHr',
  shortLabel: m.exp_avg_hr_short_label(),
  friendlyName: m.exp_avg_hr_friendly_name(),
  oneLiner: m.exp_avg_hr_one_liner(),
  range: m.exp_avg_hr_range(),
};

const avgPace: MetricExplanation = {
  id: 'avgPace',
  shortLabel: m.exp_avg_pace_short_label(),
  friendlyName: m.exp_avg_pace_friendly_name(),
  oneLiner: m.exp_avg_pace_one_liner(),
  range: m.exp_avg_pace_range(),
};

const avgSpeed: MetricExplanation = {
  id: 'avgSpeed',
  shortLabel: m.exp_avg_speed_short_label(),
  friendlyName: m.exp_avg_speed_friendly_name(),
  oneLiner: m.exp_avg_speed_one_liner(),
  range: m.exp_avg_speed_range(),
};

const avgPower: MetricExplanation = {
  id: 'avgPower',
  shortLabel: m.exp_avg_power_short_label(),
  friendlyName: m.exp_avg_power_friendly_name(),
  oneLiner: m.exp_avg_power_one_liner(),
  range: m.exp_avg_power_range(),
};

const elevation: MetricExplanation = {
  id: 'elevation',
  shortLabel: m.exp_elevation_short_label(),
  friendlyName: m.exp_elevation_friendly_name(),
  oneLiner: m.exp_elevation_one_liner(),
  range: m.exp_elevation_range(),
};

const vam: MetricExplanation = {
  id: 'vam',
  friendlyName: m.exp_vam_friendly_name(),
  oneLiner: m.exp_vam_one_liner(),
  range: m.exp_vam_range(),
};

const cadence: MetricExplanation = {
  id: 'cadence',
  shortLabel: m.exp_cadence_short_label(),
  friendlyName: m.exp_cadence_friendly_name(),
  oneLiner: m.exp_cadence_one_liner(),
  range: m.exp_cadence_range(),
};

const vdot: MetricExplanation = {
  id: 'vdot',
  shortLabel: m.exp_vdot_short_label(),
  friendlyName: m.exp_vdot_friendly_name(),
  oneLiner: m.exp_vdot_one_liner(),
  range: m.exp_vdot_range(),
};

const calories: MetricExplanation = {
  id: 'calories',
  shortLabel: m.exp_calories_short_label(),
  friendlyName: m.exp_calories_friendly_name(),
  oneLiner: m.exp_calories_one_liner(),
  range: m.exp_calories_range(),
};

const movingTime: MetricExplanation = {
  id: 'movingTime',
  shortLabel: m.exp_moving_time_short_label(),
  friendlyName: m.exp_moving_time_friendly_name(),
  oneLiner: m.exp_moving_time_one_liner(),
  range: m.exp_moving_time_range(),
};

const decoupling: MetricExplanation = {
  id: 'decoupling',
  shortLabel: m.exp_decoupling_short_label(),
  friendlyName: m.exp_decoupling_friendly_name(),
  oneLiner: m.exp_decoupling_one_liner(),
  range: m.exp_decoupling_range(),
};

const intensityFactor: MetricExplanation = {
  id: 'intensityFactor',
  shortLabel: m.exp_intensity_factor_short_label(),
  friendlyName: m.exp_intensity_factor_friendly_name(),
  oneLiner: m.exp_intensity_factor_one_liner(),
  range: m.exp_intensity_factor_range(),
};

const variabilityIndex: MetricExplanation = {
  id: 'variabilityIndex',
  shortLabel: m.exp_variability_index_short_label(),
  friendlyName: m.exp_variability_index_friendly_name(),
  oneLiner: m.exp_variability_index_one_liner(),
  range: m.exp_variability_index_range(),
};

const peakPower: MetricExplanation = {
  id: 'peakPower',
  shortLabel: m.exp_peak_power_short_label(),
  friendlyName: m.exp_peak_power_friendly_name(),
  oneLiner: m.exp_peak_power_one_liner(),
  range: m.exp_peak_power_range(),
};

const stepLength: MetricExplanation = {
  id: 'stepLength',
  shortLabel: m.exp_step_length_short_label(),
  friendlyName: m.exp_step_length_friendly_name(),
  oneLiner: m.exp_step_length_one_liner(),
  range: m.exp_step_length_range(),
};

export const EXPLANATION_BY_METRIC: Record<MetricId, MetricExplanation> = {
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
