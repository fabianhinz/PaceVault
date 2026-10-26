import { m } from '@pacevault/i18n/messages.js';
import type { ColorMode, ColorModeUnavailableReason } from '@/lib/colorModes.ts';

export const LABEL_BY_COLOR_MODE: Record<ColorMode, () => string> = {
  sport: m.ui_color_by_sport,
  hr: m.ui_color_by_hr,
  power: m.ui_color_by_power,
  pace: m.ui_color_by_pace,
  speed: m.ui_color_by_speed,
  wind: m.ui_color_by_wind,
};

export const DESCRIPTION_BY_COLOR_MODE: Record<Exclude<ColorMode, 'speed'>, () => string> = {
  sport: m.ui_color_by_sport_desc,
  hr: m.ui_color_by_hr_desc,
  power: m.ui_color_by_power_desc,
  pace: m.ui_color_by_pace_desc,
  wind: m.ui_color_by_wind_desc,
};

export const PILL_LABEL_BY_COLOR_MODE: Record<ColorMode, () => string> = {
  sport: m.ui_color_by,
  hr: m.ui_color_by_pill_hr,
  power: m.ui_color_by_pill_power,
  pace: m.ui_color_by_pill_pace,
  speed: m.ui_color_by_pill_speed,
  wind: m.ui_color_by_pill_wind,
};

export const COMPACT_LABEL_BY_COLOR_MODE: Record<ColorMode, () => string> = {
  ...PILL_LABEL_BY_COLOR_MODE,
  sport: m.ui_color_by_sport,
};

export const REASON_BY_UNAVAILABLE_COLOR_MODE: Record<ColorModeUnavailableReason, () => string> = {
  hrThresholds: m.ui_color_by_reason_hr_thresholds,
  ftp: m.ui_color_by_reason_ftp,
  thresholdPace: m.ui_color_by_reason_threshold_pace,
  noHrData: m.ui_color_by_reason_no_hr_data,
  noPowerData: m.ui_color_by_reason_no_power_data,
  noPaceData: m.ui_color_by_reason_no_pace_data,
  noSpeedData: m.ui_color_by_reason_no_speed_data,
  noWeather: m.ui_color_by_reason_no_weather,
  weatherLoading: m.ui_color_by_reason_weather_loading,
  noGps: m.ui_color_by_reason_no_gps,
};
