import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Flag, X } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { ResponsivePopover } from '@/components/ui/ResponsivePopover.tsx';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup.tsx';
import { Slider } from '@/components/ui/Slider.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { glassClass } from '@/components/ui/Card.tsx';
import { cn } from '@/lib/utils.ts';
import { recordedDistance, splitDistanceRange } from '@/lib/dynamicLaps.ts';
import {
  buildDeviceLapSet,
  buildLapSet,
  effectiveSplitDistance,
  stepLap,
  type LapSet,
  type LapSource,
} from '@/lib/lapSet.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import type { SessionLap, SessionRecord, Sport } from '@/packages/engine/types.ts';
import { LapSwatch } from './LapStrip.tsx';
import { lapCountLabel, lapName, splitDistanceLabel, splitKm } from './lapLabels.ts';

const pillLabel = (source: LapSource, set: LapSet | null, splitDistance: number): string => {
  if (!set || source === 'off') return m.ui_laps();
  if (source === 'device') return lapCountLabel(set.analysis.length, 'device');
  return m.ui_laps_pill_splits({ distance: splitKm(splitDistance) });
};

interface LapsControlProps {
  records: SessionRecord[];
  laps: SessionLap[];
  sport: Sport;
}

interface LapsPickerProps extends LapsControlProps {
  source: LapSource;
  splitDistance: number;
  current: LapSet | null;
  onDone: () => void;
}

const rowClass =
  'rounded-lg px-2 py-2 hover:bg-white/5 group-data-[checked]/row:hover:bg-transparent';

const SplitSlider = (props: { records: SessionRecord[]; sport: Sport; value: number }) => {
  const records = props.records;
  const sport = props.sport;
  const range = useMemo(
    () => splitDistanceRange(sport, recordedDistance(records)),
    [sport, records],
  );
  const value = Math.min(range.max, Math.max(range.min, props.value));

  return (
    <div className="flex flex-col gap-1.5 pt-0.5 pr-2 pb-2.5 pl-10">
      <div className="flex items-baseline justify-between">
        <Typography variant="caption" color="textTertiary">
          {m.ui_laps_split_distance()}
        </Typography>
        <span data-testid="split-distance-value" className="text-sm font-medium tabular-nums">
          {splitDistanceLabel(props.value)}
        </span>
      </div>
      <Slider
        value={[value]}
        min={range.min}
        max={range.max}
        step={range.step}
        disabled={range.max <= range.min}
        aria-label={m.ui_laps_split_distance()}
        onValueChange={(next) => {
          const metres = next[0];
          if (metres !== undefined) useMapFocusStore.getState().setSplitDistance(metres);
        }}
      />
      <div className="flex justify-between text-xs text-text-tertiary tabular-nums">
        <span>{splitDistanceLabel(range.min)}</span>
        <span>{splitDistanceLabel(range.max)}</span>
      </div>
    </div>
  );
};

const LapsPicker = (props: LapsPickerProps) => {
  const source = props.source;
  const records = props.records;
  const laps = props.laps;
  const current = props.current;
  const splitDistance = props.splitDistance;

  const isDeviceSource = source === 'device';
  const builtDeviceSet = useMemo(() => {
    if (isDeviceSource) return null;
    return buildDeviceLapSet(records, laps);
  }, [isDeviceSource, records, laps]);
  let deviceSet = builtDeviceSet;
  if (isDeviceSource) deviceSet = current;
  const splitSet = useMemo(() => {
    if (source === 'splits') return current;
    return buildLapSet(records, laps, 'splits', splitDistance);
  }, [source, current, records, laps, splitDistance]);

  const hasDeviceLaps = laps.length > 0;
  let deviceDesc: string = m.ui_laps_device_none();
  if (source === 'device' && current) {
    deviceDesc = lapCountLabel(current.analysis.length, 'device');
  } else if (hasDeviceLaps) {
    deviceDesc = m.ui_laps_device_desc({ count: String(laps.length) });
  }
  let splitsDesc: string = m.ui_laps_splits_desc();
  if (source === 'splits') {
    splitsDesc = lapCountLabel(current?.analysis.length ?? 0, 'splits');
  }

  const rows: Array<{
    value: LapSource;
    title: string;
    desc: string;
    set: LapSet | null;
    disabled: boolean;
  }> = [
    {
      value: 'off',
      title: m.ui_laps_off(),
      desc: m.ui_laps_off_desc(),
      set: null,
      disabled: false,
    },
    {
      value: 'device',
      title: m.ui_laps_device(),
      desc: deviceDesc,
      set: deviceSet,
      disabled: !hasDeviceLaps,
    },
    {
      value: 'splits',
      title: m.ui_laps_splits(),
      desc: splitsDesc,
      set: splitSet,
      disabled: false,
    },
  ];

  return (
    <RadioGroup
      value={source}
      onValueChange={(value) => {
        if (value === 'off' || value === 'device') {
          useMapFocusStore.getState().setLapSource(value);
          props.onDone();
          return;
        }
        if (value === 'splits') useMapFocusStore.getState().setLapSource('splits');
      }}
      className="gap-1"
    >
      {rows.map((item) => (
        <div
          key={item.value}
          data-checked={source === item.value ? '' : undefined}
          className="group/row rounded-lg data-[checked]:bg-white/5"
        >
          <RadioGroupItem value={item.value} disabled={item.disabled} className={rowClass}>
            <span className="min-w-0 flex-1">
              <Typography variant="subtitle1" as="span" className="block">
                {item.title}
              </Typography>
              <Typography variant="caption" as="span" color="textTertiary" className="block">
                {item.desc}
              </Typography>
            </span>
            <LapSwatch set={item.set} muted={item.disabled} />
          </RadioGroupItem>
          {item.value === 'splits' && source === 'splits' && (
            <SplitSlider records={records} sport={props.sport} value={splitDistance} />
          )}
        </div>
      ))}
    </RadioGroup>
  );
};

const StepButton = (props: {
  label: string;
  testId: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button
    type="button"
    aria-label={props.label}
    data-testid={props.testId}
    disabled={props.disabled}
    onClick={props.onClick}
    className={cn(
      'inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full',
      'text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      'disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent',
    )}
  >
    {props.children}
  </button>
);

const LapStepper = (props: { set: LapSet; lapIndex: number }) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') useMapFocusStore.getState().clearSelectedLap();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const lap = props.set.analysis.find((candidate) => candidate.lapIndex === props.lapIndex);
  const previous = stepLap(props.set.bands, props.lapIndex, -1);
  const next = stepLap(props.set.bands, props.lapIndex, 1);

  return (
    <div
      role="group"
      aria-label={m.ui_laps()}
      data-testid="lap-stepper"
      className={cn(
        glassClass,
        'pointer-events-auto inline-flex shrink-0 items-center gap-0.5 rounded-full py-1 pr-1 pl-3',
        'text-sm whitespace-nowrap text-text-primary',
      )}
    >
      <Flag size={16} className="mr-1 shrink-0" />
      <StepButton
        label={m.ui_lap_prev()}
        testId="lap-stepper-prev"
        disabled={previous === undefined}
        onClick={() => {
          if (previous !== undefined) useMapFocusStore.getState().selectLap(previous);
        }}
      >
        <ChevronLeft size={16} />
      </StepButton>
      <span
        data-testid="lap-stepper-name"
        className={cn(
          'w-[72px] text-center tabular-nums',
          lap && lap.intensity !== 'active' && 'text-text-tertiary',
        )}
      >
        {lapName(props.lapIndex)}
      </span>
      <StepButton
        label={m.ui_lap_next()}
        testId="lap-stepper-next"
        disabled={next === undefined}
        onClick={() => {
          if (next !== undefined) useMapFocusStore.getState().selectLap(next);
        }}
      >
        <ChevronRight size={16} />
      </StepButton>
      <span aria-hidden className="h-5 w-px shrink-0 bg-white/10" />
      <StepButton
        label={m.ui_lap_clear()}
        testId="lap-stepper-clear"
        onClick={() => useMapFocusStore.getState().clearSelectedLap()}
      >
        <X size={16} />
      </StepButton>
    </div>
  );
};

export const LapsControl = (props: LapsControlProps) => {
  const [open, setOpen] = useState(false);
  const lapSource = useMapFocusStore((s) => s.lapSource);
  const storedSplitDistance = useMapFocusStore((s) => s.splitDistance);
  const sessionLaps = useMapFocusStore((s) => s.sessionLaps);
  const selected = useMapFocusStore((s) => s.selectedLapIndex);
  const records = props.records;
  const sessionMetres = useMemo(() => recordedDistance(records), [records]);
  const splitDistance = effectiveSplitDistance(storedSplitDistance, props.sport, sessionMetres);

  let source = lapSource;
  if (source === 'device' && props.laps.length === 0) {
    source = 'off';
  }

  const hasSelectedLap =
    selected !== null &&
    sessionLaps !== null &&
    sessionLaps.bands.some((band) => band.lapIndex === selected);
  if (hasSelectedLap && sessionLaps) {
    return <LapStepper set={sessionLaps} lapIndex={selected} />;
  }

  return (
    <ResponsivePopover
      open={open}
      onOpenChange={setOpen}
      title={m.ui_laps()}
      side="top"
      align="center"
      className="lg:w-80"
      trigger={
        <button
          type="button"
          data-testid="laps-pill"
          className={cn(
            glassClass,
            'pointer-events-auto inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-3 py-2',
            'text-sm whitespace-nowrap text-text-primary transition-colors hover:bg-white/10',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          )}
        >
          <Flag size={16} />
          <span>{pillLabel(source, sessionLaps, splitDistance)}</span>
          {source !== 'off' && sessionLaps && <LapSwatch set={sessionLaps} />}
          <ChevronDown size={14} className="text-text-tertiary" />
        </button>
      }
    >
      <div className="mb-3 flex items-center gap-2 text-text-tertiary">
        <Flag size={14} />
        <Typography variant="caption">{m.ui_laps()}</Typography>
      </div>
      <LapsPicker
        records={props.records}
        laps={props.laps}
        sport={props.sport}
        source={source}
        splitDistance={splitDistance}
        current={sessionLaps}
        onDone={() => setOpen(false)}
      />
    </ResponsivePopover>
  );
};
