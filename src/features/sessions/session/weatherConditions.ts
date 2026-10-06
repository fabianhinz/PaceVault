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
import type { WeatherCondition } from '@/lib/weather.ts';

export const CONDITION_ICONS: Record<WeatherCondition, LucideIcon> = {
  clear: Sun,
  'partly-cloudy': CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  thunderstorm: CloudLightning,
};

export const CONDITION_LABELS: Record<WeatherCondition, () => string> = {
  clear: m.ui_weather_clear,
  'partly-cloudy': m.ui_weather_partly_cloudy,
  cloudy: m.ui_weather_cloudy,
  fog: m.ui_weather_fog,
  drizzle: m.ui_weather_drizzle,
  rain: m.ui_weather_rain,
  snow: m.ui_weather_snow,
  thunderstorm: m.ui_weather_thunderstorm,
};
