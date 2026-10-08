import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { CollapsibleListItem } from '@/components/ui/Collapsible.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import type { WeatherSnapshot } from '@/lib/weather.ts';
import { summarizeWeather, type ValueRange, type WeatherSummary } from '@/lib/weatherSummary.ts';
import { WIND_COLORS } from '@/lib/zoneColors.ts';
import type { SessionRecord, TrainingSession } from '@/packages/engine/types.ts';
import type { WindExposure } from '@/packages/engine/windExposure.ts';
import { useSessionWeather } from './hooks/useSessionWeather.ts';
import { useWindExposure } from './hooks/useWindExposure.ts';
import { useWindRose } from './hooks/useWindRose.ts';
import { weatherIcon, weatherLabel } from './weatherConditions.ts';
import { WeatherHourlyTable } from './WeatherHourlyTable.tsx';
import { WindRose, WindRoseGlyph } from './WindRose.tsx';

const hourFmt = new Intl.DateTimeFormat(getLocale(), { hour: 'numeric', minute: '2-digit' });
const celsiusFmt = new Intl.NumberFormat(getLocale(), {
  style: 'unit',
  unit: 'celsius',
  maximumFractionDigits: 0,
});
const windFmt = new Intl.NumberFormat(getLocale(), {
  style: 'unit',
  unit: 'kilometer-per-hour',
  maximumFractionDigits: 0,
});
const percentFmt = new Intl.NumberFormat(getLocale(), { style: 'percent' });

const formatRange = (range: ValueRange, format: Intl.NumberFormat): string => {
  const min = Math.round(range.min);
  const max = Math.round(range.max);
  if (min === max) return format.format(min);
  return format.formatRange(min, max);
};

const WIND_LEGEND = [
  {
    key: 'head',
    label: m.ui_weather_headwind,
    mostly: m.ui_weather_wind_mostly_head,
    pct: (exposure: WindExposure) => exposure.headwindPct,
  },
  {
    key: 'cross',
    label: m.ui_weather_crosswind,
    mostly: m.ui_weather_wind_mostly_cross,
    pct: (exposure: WindExposure) => exposure.crosswindPct,
  },
  {
    key: 'tail',
    label: m.ui_weather_tailwind,
    mostly: m.ui_weather_wind_mostly_tail,
    pct: (exposure: WindExposure) => exposure.tailwindPct,
  },
] as const;

const secondaryLine = (summary: WeatherSummary, exposure: WindExposure | null): string => {
  const change = summary.firstChange;
  if (change !== undefined) {
    return m.ui_weather_change_from({
      condition: weatherLabel(change.weatherCode),
      time: hourFmt.format(change.time),
    });
  }
  const range = formatRange(summary.windSpeed, windFmt);
  if (exposure === null) return m.ui_weather_wind({ range });
  const dominant = WIND_LEGEND.reduce((best, entry) => {
    if (entry.pct(exposure) > best.pct(exposure)) return entry;
    return best;
  });
  return dominant.mostly({ range });
};

const WindLegend = (props: { exposure: WindExposure }) => (
  <div className="flex flex-wrap gap-3 text-xs text-text-tertiary tabular-nums">
    {WIND_LEGEND.map((entry) => (
      <span key={entry.key} className="inline-flex items-center gap-1">
        <span
          aria-hidden
          className="size-2 rounded-[2px]"
          style={{ backgroundColor: WIND_COLORS[entry.key] }}
        />
        {entry.label()}
        <span className="font-medium text-text-primary">
          {percentFmt.format(entry.pct(props.exposure) / 100)}
        </span>
      </span>
    ))}
  </div>
);

interface WeatherDetailsProps {
  snapshots: WeatherSnapshot[];
  rose: number[] | null;
  exposure: WindExposure | null;
}

const WeatherDetails = (props: WeatherDetailsProps) => (
  <div className="flex flex-col gap-3">
    {props.rose !== null && (
      <div className="flex items-center gap-3.5">
        <WindRose shares={props.rose} size={118} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Typography variant="caption" color="textTertiary">
            {m.ui_weather_rose_caption()}
          </Typography>
          {props.exposure !== null && <WindLegend exposure={props.exposure} />}
        </div>
      </div>
    )}
    <WeatherHourlyTable snapshots={props.snapshots} />
  </div>
);

interface WeatherCardProps {
  session: TrainingSession;
  records: SessionRecord[];
}

export const WeatherCard = (props: WeatherCardProps) => {
  const query = useSessionWeather(props.session.id, props.session.date, props.session.duration);
  const weather = query.data ?? null;
  const exposure = useWindExposure(props.records, weather, props.session.date);
  const rose = useWindRose(props.records, weather, props.session.date);

  if (query.isLoading) {
    return <div className="h-[52px] animate-pulse bg-white/5" />;
  }
  if (weather === null) return null;
  const summary = summarizeWeather(weather.snapshots);
  if (summary === undefined) return null;

  const ConditionIcon = weatherIcon(summary.weatherCode);

  return (
    <CollapsibleListItem
      testId="weather-card"
      avatar={
        rose !== null ? (
          <WindRoseGlyph shares={rose} size={30} />
        ) : (
          <ConditionIcon size={20} aria-hidden className="shrink-0 text-text-secondary" />
        )
      }
      primary={
        <span className="tabular-nums">
          {weatherLabel(summary.weatherCode)} {formatRange(summary.temperature, celsiusFmt)}
        </span>
      }
      secondary={secondaryLine(summary, exposure)}
    >
      <WeatherDetails snapshots={weather.snapshots} rose={rose} exposure={exposure} />
    </CollapsibleListItem>
  );
};
