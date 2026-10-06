import { useState } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { Cloud } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { cn } from '@/lib/utils.ts';
import { glassClass } from '@/components/ui/Card.tsx';
import { CollapsibleContent, CollapsibleHeader } from '@/components/ui/Collapsible.tsx';
import { ResponsivePopover } from '@/components/ui/ResponsivePopover.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';
import type { SessionWeather, WeatherSnapshot } from '@/lib/weather.ts';
import { summarizeWeather, type ValueRange, type WeatherSummary } from '@/lib/weatherSummary.ts';
import { WIND_COLORS } from '@/lib/zoneColors.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';
import type { WindExposure } from '@/packages/engine/windExposure.ts';
import { useWindExposure } from './hooks/useWindExposure.ts';
import { useWindRose } from './hooks/useWindRose.ts';
import { CONDITION_ICONS, CONDITION_LABELS } from './weatherConditions.ts';
import { WeatherHourlyTable } from './WeatherHourlyTable.tsx';
import { WindRose, WindRoseGlyph } from './WindRose.tsx';

const hourFmt = new Intl.DateTimeFormat(getLocale(), { hour: 'numeric', minute: '2-digit' });
const celsiusFmt = new Intl.NumberFormat(getLocale(), {
  style: 'unit',
  unit: 'celsius',
  maximumFractionDigits: 0,
});
const percentFmt = new Intl.NumberFormat(getLocale(), { style: 'percent' });

const formatTemperatureRange = (range: ValueRange): string => {
  const min = Math.round(range.min);
  const max = Math.round(range.max);
  if (min === max) return celsiusFmt.format(min);
  return celsiusFmt.formatRange(min, max);
};

const PeekTitle = (props: { summary: WeatherSummary }) => {
  const change = props.summary.firstChange;
  return (
    <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1.5 text-sm text-text-secondary tabular-nums">
      <span className="font-medium text-text-primary">
        {CONDITION_LABELS[props.summary.condition]()}
      </span>
      <span>{formatTemperatureRange(props.summary.temperature)}</span>
      {change !== undefined && (
        <span className="whitespace-nowrap max-lg:basis-full">
          <span aria-hidden className="mr-1.5 text-text-quaternary max-lg:hidden">
            ·
          </span>
          <span className="text-status-info">
            {m.ui_weather_change_from({
              condition: CONDITION_LABELS[change.condition](),
              time: hourFmt.format(change.time),
            })}
          </span>
        </span>
      )}
    </span>
  );
};

const WIND_LEGEND = [
  {
    key: 'head',
    label: m.ui_weather_headwind,
    pct: (exposure: WindExposure) => exposure.headwindPct,
  },
  {
    key: 'cross',
    label: m.ui_weather_crosswind,
    pct: (exposure: WindExposure) => exposure.crosswindPct,
  },
  {
    key: 'tail',
    label: m.ui_weather_tailwind,
    pct: (exposure: WindExposure) => exposure.tailwindPct,
  },
] as const;

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
  query: UseQueryResult<SessionWeather | null, Error>;
  records: SessionRecord[];
  sessionStartMs: number;
}

export const WeatherCard = (props: WeatherCardProps) => {
  const weather = props.query.data ?? null;
  const exposure = useWindExposure(props.records, weather, props.sessionStartMs);
  const rose = useWindRose(props.records, weather, props.sessionStartMs);
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(false);

  if (props.query.isLoading) {
    return <div className={cn(glassClass, 'h-12 animate-pulse rounded-2xl')} />;
  }
  if (weather === null) return null;
  const summary = summarizeWeather(weather.snapshots);
  if (summary === undefined) return null;

  const ConditionIcon = CONDITION_ICONS[summary.condition];
  const peek = (
    <>
      {rose !== null ? (
        <WindRoseGlyph shares={rose} size={30} />
      ) : (
        <ConditionIcon size={20} aria-hidden className="shrink-0 text-text-secondary" />
      )}
      <PeekTitle summary={summary} />
    </>
  );
  const details = <WeatherDetails snapshots={weather.snapshots} rose={rose} exposure={exposure} />;
  const headerClass = 'gap-2.5 rounded-2xl py-2 pr-2 pl-3';

  if (isDesktop) {
    return (
      <div data-testid="weather-card" className={cn(glassClass, 'overflow-hidden rounded-2xl')}>
        <CollapsibleHeader
          open={open}
          onClick={() => setOpen((prev) => !prev)}
          className={headerClass}
        >
          {peek}
        </CollapsibleHeader>
        <CollapsibleContent open={open}>
          <div className="px-3 pt-1 pb-3">{details}</div>
        </CollapsibleContent>
      </div>
    );
  }

  return (
    <div data-testid="weather-card" className={cn(glassClass, 'overflow-hidden rounded-2xl')}>
      <ResponsivePopover
        open={open}
        onOpenChange={setOpen}
        title={m.ui_weather_title()}
        trigger={
          <CollapsibleHeader open={open} className={headerClass}>
            {peek}
          </CollapsibleHeader>
        }
      >
        <div className="mb-3 flex items-center gap-2 text-text-tertiary">
          <Cloud size={14} />
          <Typography variant="caption">{m.ui_weather_title()}</Typography>
        </div>
        {details}
      </ResponsivePopover>
    </div>
  );
};
