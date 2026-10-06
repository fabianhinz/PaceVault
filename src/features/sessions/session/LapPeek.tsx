import { useEffect, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { glassClass } from '@/components/ui/Card.tsx';
import { cn } from '@/lib/utils.ts';
import { formatChartTime } from '@/lib/chartTheme.ts';
import { railPaceFromSecPerKm } from '@/lib/railFormat.ts';
import { stepLap } from '@/lib/lapSet.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import type { Sport } from '@/packages/engine/types.ts';
import { lapName } from './lapLabels.ts';

const MISSING = '--';

const integerFmt = new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 });
const speedFmt = new Intl.NumberFormat(getLocale(), {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const kmFmt = new Intl.NumberFormat(getLocale(), {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const COLUMNS = {
  desktop: 'grid-cols-[32px_80px_64px_64px_72px_68px_60px_32px_32px]',
  phone: 'grid-cols-[30px_72px_56px_64px_60px_30px_30px]',
};

type PeekVariant = keyof typeof COLUMNS;

const Slot = (props: { children: ReactNode; className?: string; testId?: string }) => (
  <span
    data-testid={props.testId}
    className={cn('overflow-hidden pr-1.5 text-right', props.className)}
  >
    {props.children}
  </span>
);

const Value = (props: { value: string | undefined; unit: string }) => {
  if (props.value === undefined) return <span className="text-text-quaternary">{MISSING}</span>;
  return (
    <>
      {props.value}
      <small className="text-[11px] text-text-tertiary">{props.unit}</small>
    </>
  );
};

const IconButton = (props: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  testId: string;
  children: ReactNode;
}) => (
  <button
    type="button"
    aria-label={props.label}
    data-testid={props.testId}
    disabled={props.disabled}
    onClick={props.onClick}
    className={cn(
      'inline-flex size-7 cursor-pointer items-center justify-center justify-self-center rounded-full',
      'text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      'disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent',
    )}
  >
    {props.children}
  </button>
);

const paceOrSpeed = (secPerKm: number | undefined, sport: Sport) => {
  if (secPerKm === undefined) return { value: undefined, unit: '' };
  if (sport === 'running') return { value: railPaceFromSecPerKm(secPerKm), unit: '/km' };
  return { value: speedFmt.format(3600 / secPerKm), unit: ' km/h' };
};

const formatOptional = (value: number | undefined, format: Intl.NumberFormat) => {
  if (value === undefined) return undefined;
  return format.format(value);
};

export const LapPeek = (props: { variant: PeekVariant; sport: Sport }) => {
  const selected = useMapFocusStore((s) => s.selectedLapIndex);
  const sessionLaps = useMapFocusStore((s) => s.sessionLaps);

  useEffect(() => {
    if (selected === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') useMapFocusStore.getState().clearSelectedLap();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected]);

  if (selected === null || !sessionLaps) return null;
  const lap = sessionLaps.analysis.find((candidate) => candidate.lapIndex === selected);
  if (!lap) return null;
  const enrichment = sessionLaps.enrichments.find((item) => item.lapIndex === selected);

  const previous = stepLap(sessionLaps.bands, selected, -1);
  const next = stepLap(sessionLaps.bands, selected, 1);
  const pace = paceOrSpeed(lap.paceSecPerKm, props.sport);
  let distanceKm: number | undefined = undefined;
  if (lap.distance !== undefined) {
    distanceKm = lap.distance / 1000;
  }
  const isPhone = props.variant === 'phone';

  return (
    <div
      data-testid="lap-peek"
      className={cn(
        glassClass,
        'pointer-events-auto grid items-center rounded-full p-1 text-[13px] leading-[18px] whitespace-nowrap tabular-nums',
        COLUMNS[props.variant],
      )}
    >
      <IconButton
        label={m.ui_lap_prev()}
        testId="lap-peek-prev"
        disabled={previous === undefined}
        onClick={() => {
          if (previous !== undefined) useMapFocusStore.getState().selectLap(previous);
        }}
      >
        <ChevronLeft size={16} />
      </IconButton>
      <Slot
        testId="lap-peek-name"
        className={cn(
          'pl-1 text-left font-medium',
          lap.intensity !== 'active' && 'text-text-tertiary',
        )}
      >
        {lapName(lap.lapIndex)}
      </Slot>
      {!isPhone && (
        <Slot>
          <Value value={formatOptional(distanceKm, kmFmt)} unit=" km" />
        </Slot>
      )}
      <Slot>{formatChartTime(lap.movingTime / 60)}</Slot>
      <Slot>
        <Value value={pace.value} unit={pace.unit} />
      </Slot>
      <Slot>
        <Value value={formatOptional(lap.avgHr, integerFmt)} unit=" bpm" />
      </Slot>
      {!isPhone && (
        <Slot>
          <Value value={formatOptional(enrichment?.avgPower, integerFmt)} unit=" W" />
        </Slot>
      )}
      <IconButton
        label={m.ui_lap_next()}
        testId="lap-peek-next"
        disabled={next === undefined}
        onClick={() => {
          if (next !== undefined) useMapFocusStore.getState().selectLap(next);
        }}
      >
        <ChevronRight size={16} />
      </IconButton>
      <IconButton
        label={m.ui_lap_clear()}
        testId="lap-peek-clear"
        onClick={() => useMapFocusStore.getState().clearSelectedLap()}
      >
        <X size={16} />
      </IconButton>
    </div>
  );
};
