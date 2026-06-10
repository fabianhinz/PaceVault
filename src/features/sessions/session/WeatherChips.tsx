import { useState } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Thermometer,
  Droplets,
  Wind,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import type { SessionWeather, WeatherCondition } from '@/lib/weather.ts';
import { formatWindDirection } from '@/lib/weather.ts';

const conditionIcons: Record<WeatherCondition, LucideIcon> = {
  clear: Sun,
  'partly-cloudy': CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  thunderstorm: CloudLightning,
};

const conditionLabels: Record<WeatherCondition, () => string> = {
  clear: m.ui_weather_clear,
  'partly-cloudy': m.ui_weather_partly_cloudy,
  cloudy: m.ui_weather_cloudy,
  fog: m.ui_weather_fog,
  drizzle: m.ui_weather_drizzle,
  rain: m.ui_weather_rain,
  snow: m.ui_weather_snow,
  thunderstorm: m.ui_weather_thunderstorm,
};

const chipClass =
  'inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-xs text-text-tertiary';

const skeletonChipClass = 'h-6 animate-pulse rounded-lg bg-white/10';

const formatRange = (values: number[], unit: string): string => {
  const min = Math.round(Math.min(...values));
  const max = Math.round(Math.max(...values));
  if (min === max) return `${min}${unit}`;
  return `${min}\u2013${max}${unit}`;
};

const DEFAULT_VISIBLE_CHIPS = 3;

interface ChipData {
  icon: LucideIcon;
  label: string;
}

const buildChips = (weather: SessionWeather): ChipData[] => {
  const snapshots = weather.snapshots;
  if (snapshots.length === 0) return [];

  const first = snapshots[0];
  if (!first) return [];

  const ConditionIcon = conditionIcons[first.condition];
  const conditionLabel = conditionLabels[first.condition]();
  const temps = snapshots.map((s) => s.temperature);
  const humidities = snapshots.map((s) => s.humidity);
  const winds = snapshots.map((s) => s.windSpeed);
  const gusts = snapshots.map((s) => s.windGusts);

  return [
    { icon: Thermometer, label: formatRange(temps, '\u00B0C') },
    {
      icon: Wind,
      label: `${formatRange(winds, ' km/h')} ${formatWindDirection(first.windDirection)}`,
    },
    {
      icon: Wind,
      label: `${m.ui_weather_gusts()} ${formatRange(gusts, ' km/h')}`,
    },
    { icon: ConditionIcon, label: conditionLabel },
    { icon: Droplets, label: formatRange(humidities, '%') },
  ];
};

interface WeatherChipsProps {
  query: UseQueryResult<SessionWeather | null, Error>;
}

export const WeatherChips = (props: WeatherChipsProps) => {
  const [expanded, setExpanded] = useState(false);

  if (props.query.isLoading) {
    return (
      <div className="inline-flex gap-1">
        <div className={`${skeletonChipClass} w-24`} />
        <div className={`${skeletonChipClass} w-16`} />
      </div>
    );
  }

  if (!props.query.data) return null;

  const chips = buildChips(props.query.data);
  if (chips.length === 0) return null;

  const hiddenCount = chips.length - DEFAULT_VISIBLE_CHIPS;
  const showToggle = hiddenCount > 0 && !expanded;
  const visibleChips = expanded ? chips : chips.slice(0, DEFAULT_VISIBLE_CHIPS);

  return (
    <div className="inline-flex flex-wrap gap-1">
      {visibleChips.map((chip) => {
        const Icon = chip.icon;
        return (
          <span key={chip.label} className={chipClass}>
            <Icon size={12} />
            {chip.label}
          </span>
        );
      })}
      {showToggle && (
        <button
          type="button"
          className={`${chipClass} cursor-pointer hover:bg-white/20`}
          onClick={() => setExpanded(true)}
        >
          +{hiddenCount}
        </button>
      )}
    </div>
  );
};
