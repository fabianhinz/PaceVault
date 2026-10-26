import type { FC, ReactNode } from 'react';
import { ArrowUp, Cloud, Droplets, Thermometer, Wind, type LucideIcon } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { wmoToPrecipitationMark, type PrecipitationMark } from '@/lib/api/weather.ts';
import type { WeatherSnapshot } from '@/types.ts';
import { formatDate, formatNumber, formatUnit } from '@/lib/format/formatters.ts';
import { weatherIcon, weatherLabel } from './weatherConditions.ts';
import { PrecipitationDots } from '@/components/sessions/session/PrecipitationDots.tsx';

interface Row {
  key: string;
  icon: LucideIcon;
  label: string;
  unit?: string;
  cell: (snapshot: WeatherSnapshot) => ReactNode;
}

const cellClass = 'h-8 min-w-50px whitespace-nowrap px-1 text-center';

const skyCellLabel = ({ weatherCode, mark }: { weatherCode: number; mark: PrecipitationMark }) => {
  const label = weatherLabel(weatherCode);
  if (mark.dots === undefined) return m.ui_weather_intensity_unknown({ condition: label });
  return label;
};

interface WeatherHourlyTableProps {
  snapshots: WeatherSnapshot[];
}

export const WeatherHourlyTable: FC<WeatherHourlyTableProps> = (props) => {
  const rows: Row[] = [
    {
      key: 'weather',
      icon: Cloud,
      label: m.ui_weather_row_weather(),
      cell: (snapshot) => {
        const Icon = weatherIcon(snapshot.weatherCode);
        const mark = wmoToPrecipitationMark(snapshot.weatherCode);
        const label = skyCellLabel({ weatherCode: snapshot.weatherCode, mark });
        return (
          <span
            role="img"
            aria-label={label}
            className="inline-flex flex-col items-center gap-3px align-middle"
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
      cell: (snapshot) => formatUnit(snapshot.temperature, 'celsius'),
    },
    {
      key: 'feels-like',
      icon: Thermometer,
      label: m.ui_weather_row_feels_like(),
      cell: (snapshot) => (
        <span className="text-text-tertiary">{formatUnit(snapshot.feelsLike, 'celsius')}</span>
      ),
    },
    {
      key: 'humidity',
      icon: Droplets,
      label: m.ui_weather_row_humidity(),
      cell: (snapshot) => formatNumber(snapshot.humidity / 100, 'percent'),
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
          {formatNumber(snapshot.windSpeed)}
        </span>
      ),
    },
    {
      key: 'gusts',
      icon: Wind,
      label: m.ui_weather_gusts(),
      unit: 'km/h',
      cell: (snapshot) => (
        <span className="text-text-tertiary">{formatNumber(snapshot.windGusts)}</span>
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
                  {formatDate(snapshot.time, 'hour-minute')}
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
