import type { ReactNode } from 'react';
import { ArrowUp, Cloud, Droplets, Thermometer, Wind, type LucideIcon } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { cn } from '@/lib/utils.ts';
import { tokens } from '@/lib/tokens.ts';
import {
  wmoToPrecipitationMark,
  type PrecipitationMark,
  type PrecipitationType,
  type WeatherSnapshot,
} from '@/lib/weather.ts';
import { weatherIcon, weatherLabel } from './weatherConditions.ts';

const hourFmt = new Intl.DateTimeFormat(getLocale(), { hour: 'numeric', minute: '2-digit' });
const integerFmt = new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 });
const celsiusFmt = new Intl.NumberFormat(getLocale(), {
  style: 'unit',
  unit: 'celsius',
  maximumFractionDigits: 0,
});
const percentFmt = new Intl.NumberFormat(getLocale(), { style: 'percent' });

interface Row {
  key: string;
  icon: LucideIcon;
  label: string;
  unit?: string;
  cell: (snapshot: WeatherSnapshot) => ReactNode;
}

const cellClass = 'h-8 min-w-[50px] whitespace-nowrap px-1 text-center';

const PRECIPITATION_COLORS: Record<PrecipitationType, string> = {
  rain: tokens.precipRain,
  freezing: tokens.precipFreezing,
  snow: tokens.precipSnow,
  thunderstorm: tokens.precipThunderstorm,
};

const PrecipitationDots = (props: { mark: PrecipitationMark }) => {
  const dots = props.mark.dots;
  if (dots === undefined) {
    return (
      <svg width={12} height={6} viewBox="0 0 12 6" aria-hidden className="stroke-text-tertiary">
        <path d="M0 3h5M7 3h5" strokeWidth={1.5} />
      </svg>
    );
  }
  if (dots === 0 || props.mark.type === undefined) return null;
  const color = PRECIPITATION_COLORS[props.mark.type];
  return (
    <svg width={14} height={4} viewBox="0 0 14 4" aria-hidden>
      {[0, 1, 2].map((index) => (
        <circle
          key={index}
          cx={2 + index * 5}
          cy={2}
          r={1.6}
          fill={index < dots ? color : undefined}
          className={cn(index >= dots && 'fill-white/15')}
        />
      ))}
    </svg>
  );
};

const skyCellLabel = (weatherCode: number, mark: PrecipitationMark) => {
  const label = weatherLabel(weatherCode);
  if (mark.dots === undefined) return m.ui_weather_intensity_unknown({ condition: label });
  return label;
};

export const WeatherHourlyTable = (props: { snapshots: WeatherSnapshot[] }) => {
  const rows: Row[] = [
    {
      key: 'weather',
      icon: Cloud,
      label: m.ui_weather_row_weather(),
      cell: (snapshot) => {
        const Icon = weatherIcon(snapshot.weatherCode);
        const mark = wmoToPrecipitationMark(snapshot.weatherCode);
        const label = skyCellLabel(snapshot.weatherCode, mark);
        return (
          <span
            role="img"
            aria-label={label}
            className="inline-flex flex-col items-center gap-[3px] align-middle"
          >
            <Icon size={16} aria-hidden className="block" />
            <span className="flex h-1.5 items-center justify-center">
              <PrecipitationDots mark={mark} />
            </span>
          </span>
        );
      },
    },
    {
      key: 'temperature',
      icon: Thermometer,
      label: m.ui_weather_row_temperature(),
      cell: (snapshot) => celsiusFmt.format(snapshot.temperature),
    },
    {
      key: 'feels-like',
      icon: Thermometer,
      label: m.ui_weather_row_feels_like(),
      cell: (snapshot) => (
        <span className="text-text-tertiary">{celsiusFmt.format(snapshot.feelsLike)}</span>
      ),
    },
    {
      key: 'humidity',
      icon: Droplets,
      label: m.ui_weather_row_humidity(),
      cell: (snapshot) => percentFmt.format(snapshot.humidity / 100),
    },
    {
      key: 'wind',
      icon: Wind,
      label: m.ui_weather_row_wind(),
      unit: 'km/h',
      cell: (snapshot) => (
        <span className="inline-flex items-center gap-0.5">
          <ArrowUp
            size={12}
            aria-hidden
            style={{ transform: `rotate(${(snapshot.windDirection + 180) % 360}deg)` }}
          />
          {integerFmt.format(snapshot.windSpeed)}
        </span>
      ),
    },
    {
      key: 'gusts',
      icon: Wind,
      label: m.ui_weather_gusts(),
      unit: 'km/h',
      cell: (snapshot) => (
        <span className="text-text-tertiary">{integerFmt.format(snapshot.windGusts)}</span>
      ),
    },
  ];

  return (
    <div className="flex text-xs tabular-nums">
      <div aria-hidden className="shrink-0 pr-3 text-text-tertiary">
        <div className="h-8" />
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div
              key={row.key}
              className="flex h-8 items-center gap-1.5 whitespace-nowrap border-t border-white/5"
            >
              <Icon size={12} />
              {row.label}
              {row.unit !== undefined && <span className="text-text-quaternary">{row.unit}</span>}
            </div>
          );
        })}
      </div>
      <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <td className="sr-only" />
              {props.snapshots.map((snapshot) => (
                <th
                  key={snapshot.time}
                  scope="col"
                  className={cn(cellClass, 'font-medium text-text-tertiary')}
                >
                  {hourFmt.format(snapshot.time)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <th scope="row" className="sr-only">
                  {row.label}
                </th>
                {props.snapshots.map((snapshot) => (
                  <td
                    key={snapshot.time}
                    className={cn(cellClass, 'border-t border-white/5 text-text-primary')}
                  >
                    {row.cell(snapshot)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
