import type { ReactNode } from 'react';
import {
  ArrowUp,
  Cloud,
  Compass,
  Droplets,
  Thermometer,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { cn } from '@/lib/utils.ts';
import { formatWindDirection, type WeatherSnapshot } from '@/lib/weather.ts';
import { conditionChangeIndices } from '@/lib/weatherSummary.ts';
import { CONDITION_ICONS, CONDITION_LABELS } from './weatherConditions.ts';

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
  cell: (snapshot: WeatherSnapshot, index: number) => ReactNode;
}

const cellClass = 'h-8 min-w-[50px] whitespace-nowrap px-1 text-center';

export const WeatherHourlyTable = (props: { snapshots: WeatherSnapshot[] }) => {
  const changes = conditionChangeIndices(props.snapshots);

  const rows: Row[] = [
    {
      key: 'sky',
      icon: Cloud,
      label: m.ui_weather_row_sky(),
      cell: (snapshot, index) => {
        const Icon = CONDITION_ICONS[snapshot.condition];
        const label = CONDITION_LABELS[snapshot.condition]();
        return (
          <Icon
            size={16}
            role="img"
            aria-label={label}
            className={cn('inline-block', changes.has(index) && 'text-status-info')}
          >
            <title>{label}</title>
          </Icon>
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
    {
      key: 'direction',
      icon: Compass,
      label: m.ui_weather_row_direction(),
      cell: (snapshot) => formatWindDirection(snapshot.windDirection),
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
              {props.snapshots.map((snapshot, index) => (
                <th
                  key={snapshot.time}
                  scope="col"
                  className={cn(
                    cellClass,
                    'font-medium text-text-tertiary',
                    changes.has(index) && 'text-status-info',
                  )}
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
                {props.snapshots.map((snapshot, index) => (
                  <td
                    key={snapshot.time}
                    className={cn(cellClass, 'border-t border-white/5 text-text-primary')}
                  >
                    {row.cell(snapshot, index)}
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
