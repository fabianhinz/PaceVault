import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import {
  wmoToCondition,
  wmoToDescription,
  type WeatherCondition,
  type WeatherDescription,
} from '@/lib/weather.ts';

const CONDITION_ICONS: Record<WeatherCondition, LucideIcon> = {
  clear: Sun,
  'partly-cloudy': CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  thunderstorm: CloudLightning,
};

const DESCRIPTION_LABELS: Record<WeatherDescription, () => string> = {
  clear: m.ui_weather_clear,
  'partly-cloudy': m.ui_weather_partly_cloudy,
  cloudy: m.ui_weather_cloudy,
  fog: m.ui_weather_fog,
  drizzle: m.ui_weather_drizzle,
  'drizzle-light': m.ui_weather_drizzle_light,
  'drizzle-moderate': m.ui_weather_drizzle_moderate,
  'drizzle-dense': m.ui_weather_drizzle_dense,
  'freezing-drizzle-light': m.ui_weather_freezing_drizzle_light,
  'freezing-drizzle-dense': m.ui_weather_freezing_drizzle_dense,
  rain: m.ui_weather_rain,
  'rain-light': m.ui_weather_rain_light,
  'rain-moderate': m.ui_weather_rain_moderate,
  'rain-heavy': m.ui_weather_rain_heavy,
  'freezing-rain-light': m.ui_weather_freezing_rain_light,
  'freezing-rain-heavy': m.ui_weather_freezing_rain_heavy,
  'rain-showers-light': m.ui_weather_rain_showers_light,
  'rain-showers-moderate': m.ui_weather_rain_showers_moderate,
  'rain-showers-heavy': m.ui_weather_rain_showers_heavy,
  snow: m.ui_weather_snow,
  'snow-light': m.ui_weather_snow_light,
  'snow-moderate': m.ui_weather_snow_moderate,
  'snow-heavy': m.ui_weather_snow_heavy,
  'snow-grains': m.ui_weather_snow_grains,
  'snow-showers-light': m.ui_weather_snow_showers_light,
  'snow-showers-heavy': m.ui_weather_snow_showers_heavy,
  thunderstorm: m.ui_weather_thunderstorm,
  'thunderstorm-heavy': m.ui_weather_thunderstorm_heavy,
  'thunderstorm-hail': m.ui_weather_thunderstorm_hail,
  'thunderstorm-hail-heavy': m.ui_weather_thunderstorm_hail_heavy,
};

export const weatherIcon = (weatherCode: number): LucideIcon =>
  CONDITION_ICONS[wmoToCondition(weatherCode)];

export const weatherLabel = (weatherCode: number): string =>
  DESCRIPTION_LABELS[wmoToDescription(weatherCode)]();
