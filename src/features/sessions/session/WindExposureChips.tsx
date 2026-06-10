import type { UseQueryResult } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ArrowLeftRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { cn } from '@/lib/utils.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';
import type { SessionWeather } from '@/lib/weather.ts';
import type { WindExposure } from '@/packages/engine/windExposure.ts';
import { useWindExposure } from './hooks/useWindExposure.ts';

interface ChipSpec {
  key: string;
  label: string;
  icon: LucideIcon;
  pct: number;
  fillClass: string;
  textClass: string;
}

const skeletonChipClass = 'h-6 w-24 animate-pulse rounded-lg bg-white/10';

const buildSpecs = (exposure: WindExposure): ChipSpec[] => [
  {
    key: 'head',
    label: m.ui_weather_headwind(),
    icon: ArrowDown,
    pct: exposure.headwindPct,
    fillClass: 'bg-gradient-to-r from-amber-500/40 to-red-500/40',
    textClass: 'text-red-200',
  },
  {
    key: 'cross',
    label: m.ui_weather_crosswind(),
    icon: ArrowLeftRight,
    pct: exposure.crosswindPct,
    fillClass: 'bg-gradient-to-r from-slate-500/40 to-slate-400/40',
    textClass: 'text-slate-200',
  },
  {
    key: 'tail',
    label: m.ui_weather_tailwind(),
    icon: ArrowUp,
    pct: exposure.tailwindPct,
    fillClass: 'bg-gradient-to-r from-teal-500/40 to-emerald-500/40',
    textClass: 'text-emerald-200',
  },
];

interface WindExposureChipsProps {
  query: UseQueryResult<SessionWeather | null, Error>;
  records: SessionRecord[];
  sessionStartMs: number;
}

export const WindExposureChips = (props: WindExposureChipsProps) => {
  const exposure = useWindExposure(props.records, props.query.data ?? null, props.sessionStartMs);

  if (props.query.isLoading) {
    return (
      <div className="inline-flex gap-1">
        <div className={skeletonChipClass} />
        <div className={skeletonChipClass} />
        <div className={skeletonChipClass} />
      </div>
    );
  }

  if (!exposure) return null;

  const specs = buildSpecs(exposure);

  return (
    <div className="inline-flex flex-wrap gap-1">
      {specs.map((spec) => {
        const Icon = spec.icon;
        return (
          <span
            key={spec.key}
            className="relative inline-flex items-center gap-1 overflow-hidden rounded-lg bg-white/5 px-2 py-1 text-xs"
          >
            <span
              aria-hidden
              className={cn('absolute inset-y-0 left-0 z-0', spec.fillClass)}
              style={{ width: `${spec.pct}%` }}
            />
            <Icon size={12} className={cn('relative z-10', spec.textClass)} />
            <span className={cn('relative z-10', spec.textClass)}>
              {spec.label} {spec.pct}%
            </span>
          </span>
        );
      })}
    </div>
  );
};
