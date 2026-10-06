import { useMemo, useState } from 'react';
import { ChevronDown, Flag } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { ResponsivePopover } from '@/components/ui/ResponsivePopover.tsx';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { glassClass } from '@/components/ui/Card.tsx';
import { cn } from '@/lib/utils.ts';
import { SPLIT_DISTANCES_M } from '@/lib/dynamicLaps.ts';
import { buildLapSet, DEFAULT_SPLIT_DISTANCE, type LapSet, type LapSource } from '@/lib/lapSet.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import type { SessionLap, SessionRecord } from '@/packages/engine/types.ts';
import { LapStrip } from './LapStrip.tsx';
import { lapCountLabel, lapSummaryLabel, splitKm } from './lapLabels.ts';

type LapRow = 'off' | 'device' | 'splits';

const rowOf = (source: LapSource): LapRow => {
  if (source === 'off' || source === 'device') return source;
  return 'splits';
};

const pillLabel = (source: LapSource, set: LapSet | null): string => {
  if (!set || source === 'off') return m.ui_laps();
  if (source === 'device') return lapCountLabel(set.analysis.length);
  return m.ui_laps_pill_splits({ distance: splitKm(source) });
};

interface LapsControlProps {
  records: SessionRecord[];
  laps: SessionLap[];
}

interface LapsPickerProps extends LapsControlProps {
  source: LapSource;
  current: LapSet | null;
  onDone: () => void;
}

const rowClass =
  'rounded-lg px-2 py-2 hover:bg-white/5 group-data-[checked]/row:hover:bg-transparent';

const LapsPicker = (props: LapsPickerProps) => {
  const row = rowOf(props.source);
  const records = props.records;
  const laps = props.laps;
  const current = props.current;

  const deviceSet = useMemo(() => {
    if (row === 'device') return current;
    return buildLapSet(records, laps, 'device');
  }, [row, current, records, laps]);
  const splitSet = useMemo(() => {
    if (row === 'splits') return current;
    return buildLapSet(records, laps, DEFAULT_SPLIT_DISTANCE);
  }, [row, current, records, laps]);

  const hasDeviceLaps = laps.length > 0;
  let deviceDesc: string = m.ui_laps_device_none();
  if (row === 'device' && current) {
    deviceDesc = lapSummaryLabel(current);
  } else if (hasDeviceLaps) {
    deviceDesc = m.ui_laps_device_desc({ count: String(laps.length) });
  }
  let splitsDesc: string = m.ui_laps_splits_desc();
  if (row === 'splits' && current) {
    splitsDesc = lapSummaryLabel(current);
  }

  const rows: Array<{
    value: LapRow;
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
      value={row}
      onValueChange={(value) => {
        if (value === 'off' || value === 'device') {
          useMapFocusStore.getState().setLapSource(value);
          props.onDone();
          return;
        }
        if (value === 'splits' && row !== 'splits') {
          useMapFocusStore.getState().setLapSource(DEFAULT_SPLIT_DISTANCE);
        }
      }}
      className="gap-1"
    >
      {rows.map((item) => (
        <div
          key={item.value}
          data-checked={row === item.value ? '' : undefined}
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
            <LapStrip set={item.set} muted={item.disabled} />
          </RadioGroupItem>
          {item.value === 'splits' && row === 'splits' && (
            <div className="flex flex-wrap gap-1 pb-2 pl-10 pr-2">
              {SPLIT_DISTANCES_M.map((distance) => (
                <button
                  key={distance}
                  type="button"
                  aria-pressed={props.source === distance}
                  onClick={() => {
                    useMapFocusStore.getState().setLapSource(distance);
                    props.onDone();
                  }}
                  className={cn(
                    'cursor-pointer rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-text-tertiary transition-colors hover:text-text-primary',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    props.source === distance && 'border-accent bg-accent/15 text-text-primary',
                  )}
                >
                  {m.ui_laps_split_chip({ distance: splitKm(distance) })}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </RadioGroup>
  );
};

export const LapsControl = (props: LapsControlProps) => {
  const [open, setOpen] = useState(false);
  const lapSource = useMapFocusStore((s) => s.lapSource);
  const sessionLaps = useMapFocusStore((s) => s.sessionLaps);

  let source = lapSource;
  if (source === 'device' && props.laps.length === 0) {
    source = 'off';
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
            'pointer-events-auto inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-2',
            'text-sm text-text-primary transition-colors hover:bg-white/10',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          )}
        >
          <Flag size={16} />
          <span>{pillLabel(source, sessionLaps)}</span>
          {source !== 'off' && sessionLaps && <LapStrip set={sessionLaps} />}
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
        source={source}
        current={sessionLaps}
        onDone={() => setOpen(false)}
      />
    </ResponsivePopover>
  );
};
