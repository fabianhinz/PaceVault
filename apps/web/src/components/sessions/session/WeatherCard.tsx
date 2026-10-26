import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { PvCollapsibleListItem } from '@pacevault/ui/components/pvCollapsibleListItem/PvCollapsibleListItem.tsx';
import {
  formatDate,
  formatUnit,
  formatUnitRange,
  type UnitFormatMode,
} from '@/lib/format/formatters.ts';
import { summarizeWeather, type ValueRange, type WeatherSummary } from '@/lib/api/weather.ts';
import type { SessionRecord, TrainingSession } from '@pacevault/engine/types.ts';
import type { WindExposure } from '@pacevault/engine/windExposure.ts';
import { useSessionWeather } from '@/queries/weather/useSessionWeather.ts';
import { useWindExposure } from './hooks/useWindExposure.ts';
import { useWindRose } from './hooks/useWindRose.ts';
import { WIND_LEGEND, weatherIcon, weatherLabel } from './weatherConditions.ts';
import { WeatherDetails } from '@/components/sessions/session/WeatherDetails.tsx';
import { WindRoseGlyph } from '@/components/sessions/session/WindRoseGlyph.tsx';

const formatRange = ({ range, mode }: { range: ValueRange; mode: UnitFormatMode }): string => {
  const min = Math.round(range.min);
  const max = Math.round(range.max);
  if (min === max) return formatUnit(min, mode);
  return formatUnitRange(min, max, mode);
};

const secondaryLine = ({
  summary,
  exposure,
}: {
  summary: WeatherSummary;
  exposure: WindExposure | null;
}): string => {
  const change = summary.firstChange;
  if (change !== undefined) {
    return m.ui_weather_change_from({
      condition: weatherLabel(change.weatherCode),
      time: formatDate(change.time, 'hour-minute'),
    });
  }
  const range = formatRange({ range: summary.windSpeed, mode: 'kilometer-per-hour' });
  if (exposure === null) return m.ui_weather_wind({ range });
  const dominant = WIND_LEGEND.reduce((best, entry) => {
    if (entry.pct(exposure) > best.pct(exposure)) return entry;
    return best;
  });
  return dominant.mostly({ range });
};

interface WeatherCardProps {
  session: TrainingSession;
  records: SessionRecord[];
}

export const WeatherCard: FC<WeatherCardProps> = (props) => {
  const sessionWeather = useSessionWeather({
    sessionId: props.session.id,
    sessionDateMs: props.session.date,
    durationSec: props.session.duration,
  });
  const weather = sessionWeather.data ?? null;
  const exposure = useWindExposure({
    records: props.records,
    weather,
    sessionStartMs: props.session.date,
  });
  const rose = useWindRose({ records: props.records, weather, sessionStartMs: props.session.date });

  if (sessionWeather.isLoading) {
    return <div className="h-52px animate-pulse bg-white/5" />;
  }
  if (weather === null) return null;
  const summary = summarizeWeather(weather.snapshots);
  if (summary === undefined) return null;

  const ConditionIcon = weatherIcon(summary.weatherCode);

  return (
    <PvCollapsibleListItem
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
          {weatherLabel(summary.weatherCode)}{' '}
          {formatRange({ range: summary.temperature, mode: 'celsius' })}
        </span>
      }
      secondary={secondaryLine({ summary, exposure })}
    >
      <WeatherDetails snapshots={weather.snapshots} rose={rose} exposure={exposure} />
    </PvCollapsibleListItem>
  );
};
