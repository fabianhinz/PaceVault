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
  ArrowDown,
  ArrowUp,
  ArrowLeftRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { cn } from '@/lib/utils.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';
import type { SessionWeather, WeatherCondition } from '@/lib/weather.ts';
import { formatWindDirection } from '@/lib/weather.ts';
import type { WindExposure } from '@/packages/engine/windExposure.ts';
import { useWindExposure } from './hooks/useWindExposure.ts';
import { glassClass } from '@/components/ui/Card.tsx';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';

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

const baseChipClass = `${glassClass} text-text-secondary inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs`;
const fillChipClass = `${baseChipClass} relative overflow-hidden`;
const skeletonChipClass = `${baseChipClass} h-[26px] animate-pulse`;

const formatRange = (values: number[], unit: string): string => {
  const min = Math.round(Math.min(...values));
  const max = Math.round(Math.max(...values));
  if (min === max) return `${min}${unit}`;
  return `${min}–${max}${unit}`;
};

interface ChipFill {
  pct: number;
  fillClass: string;
  textClass: string;
}

interface ChipData {
  key: string;
  icon: LucideIcon;
  label: string;
  fill?: ChipFill;
}

const buildWindExposureChips = (exposure: WindExposure): ChipData[] => [
  {
    key: 'tailwind',
    icon: ArrowUp,
    label: `${m.ui_weather_tailwind()} ${exposure.tailwindPct}%`,
    fill: {
      pct: exposure.tailwindPct,
      fillClass: 'bg-gradient-to-r from-teal-500/40 to-emerald-500/40',
      textClass: 'text-emerald-200',
    },
  },
  {
    key: 'headwind',
    icon: ArrowDown,
    label: `${m.ui_weather_headwind()} ${exposure.headwindPct}%`,
    fill: {
      pct: exposure.headwindPct,
      fillClass: 'bg-gradient-to-r from-amber-500/40 to-red-500/40',
      textClass: 'text-red-200',
    },
  },
  {
    key: 'crosswind',
    icon: ArrowLeftRight,
    label: `${m.ui_weather_crosswind()} ${exposure.crosswindPct}%`,
    fill: {
      pct: exposure.crosswindPct,
      fillClass: 'bg-gradient-to-r from-slate-500/40 to-slate-400/40',
      textClass: 'text-slate-200',
    },
  },
];

const buildChips = (weather: SessionWeather, exposure: WindExposure | null): ChipData[] => {
  const chips: ChipData[] = [];

  // Wind exposure leads — it's the headline insight — then the ambient weather summary.
  if (exposure) {
    chips.push(...buildWindExposureChips(exposure));
  }

  const snapshots = weather.snapshots;
  const first = snapshots[0];
  if (first) {
    const ConditionIcon = conditionIcons[first.condition];
    const conditionLabel = conditionLabels[first.condition]();
    const temps = snapshots.map((s) => s.temperature);
    const humidities = snapshots.map((s) => s.humidity);
    const winds = snapshots.map((s) => s.windSpeed);
    const gusts = snapshots.map((s) => s.windGusts);

    chips.push(
      { key: 'temperature', icon: Thermometer, label: formatRange(temps, '°C') },
      {
        key: 'wind',
        icon: Wind,
        label: `${formatRange(winds, ' km/h')} ${formatWindDirection(first.windDirection)}`,
      },
      { key: 'gusts', icon: Wind, label: `${m.ui_weather_gusts()} ${formatRange(gusts, ' km/h')}` },
      { key: 'condition', icon: ConditionIcon, label: conditionLabel },
      { key: 'humidity', icon: Droplets, label: formatRange(humidities, '%') },
    );
  }

  return chips;
};

interface WeatherChipsProps {
  query: UseQueryResult<SessionWeather | null, Error>;
  records: SessionRecord[];
  sessionStartMs: number;
}

export const WeatherChips = (props: WeatherChipsProps) => {
  const exposure = useWindExposure(props.records, props.query.data ?? null, props.sessionStartMs);
  const isDesktop = useIsDesktop();
  const [expanded, setExpanded] = useState(false);

  if (props.query.isLoading) {
    return (
      <div className="inline-flex gap-1">
        <div className={`${skeletonChipClass} w-28`} />
        <div className={`${skeletonChipClass} w-20`} />
        <div className={`${skeletonChipClass} w-24`} />
        <div className={`${skeletonChipClass} w-8`} />
      </div>
    );
  }

  if (!props.query.data) return null;

  const chips = buildChips(props.query.data, exposure);
  if (chips.length === 0) return null;

  const defaultVisibleChips = isDesktop ? 4 : 2;
  const hiddenCount = chips.length - defaultVisibleChips;
  const showToggle = hiddenCount > 0 && !expanded;
  const visibleChips = expanded ? chips : chips.slice(0, defaultVisibleChips);

  return (
    <div className="flex flex-wrap gap-1">
      {visibleChips.map((chip) => {
        const Icon = chip.icon;
        const fill = chip.fill;
        const fgClass = fill ? cn('relative z-10', fill.textClass) : undefined;
        return (
          <span key={chip.key} className={fill ? fillChipClass : baseChipClass}>
            {fill && (
              <span
                aria-hidden
                className={cn('absolute inset-y-0 left-0 z-0', fill.fillClass)}
                style={{ width: `${fill.pct}%` }}
              />
            )}
            <Icon size={12} className={fgClass} />
            <span className={fgClass}>{chip.label}</span>
          </span>
        );
      })}
      {showToggle && (
        <button
          className={`${baseChipClass} cursor-pointer hover:bg-white/20`}
          onClick={() => setExpanded(true)}
        >
          +{hiddenCount}
        </button>
      )}
    </div>
  );
};
