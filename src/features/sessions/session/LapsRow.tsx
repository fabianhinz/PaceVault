import { useDeferredValue, type ReactNode } from 'react';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { CollapsibleListItem } from '@/components/ui/Collapsible.tsx';
import { MetricLabel } from '@/components/ui/MetricLabel.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { cn } from '@/lib/utils.ts';
import { METRIC_EXPLANATIONS } from '@/lib/explanations.ts';
import { summarizeLaps } from '@/lib/lapSummary.ts';
import type { LapAnalysis } from '@/lib/laps.ts';
import type { LapSet, LapSource } from '@/lib/lapSet.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import type { SessionLap, Sport } from '@/packages/engine/types.ts';
import { LapStrip } from './LapStrip.tsx';
import { lapName, lapPaceLabel, lapsRowLabels } from './lapLabels.ts';

const bpmFmt = new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 });

const recoveryLabel = (avgBpm: number): string => {
  if (avgBpm > 25) return m.ui_stat_recovery_strong();
  if (avgBpm >= 15) return m.ui_stat_recovery_adequate();
  return m.ui_stat_recovery_slow();
};

interface KeyValueProps {
  label: ReactNode;
  value: string;
  detail: string;
  interactive?: boolean;
}

const KeyValue = (props: KeyValueProps) => (
  <div
    className={cn(
      'grid grid-cols-[auto_1fr] items-baseline gap-3 px-1.5 py-0.5',
      !props.interactive && 'pointer-events-none',
    )}
  >
    <span className="inline-flex items-center gap-0.5 whitespace-nowrap text-xs text-text-secondary">
      {props.label}
    </span>
    <span className="text-right text-sm tabular-nums text-text-primary">
      {props.value}
      <span className="block text-xs text-text-tertiary">{props.detail}</span>
    </span>
  </div>
);

const LapExtreme = (props: {
  label: string;
  lap: LapAnalysis | undefined;
  sport: Sport;
  source: LapSource;
}) => {
  const pace = props.lap?.paceSecPerKm;
  if (props.lap === undefined || pace === undefined) return null;
  return (
    <KeyValue
      label={props.label}
      value={lapPaceLabel(pace, props.sport)}
      detail={lapName(props.lap.lapIndex, props.source)}
    />
  );
};

const LapsDetails = (props: { set: LapSet; sport: Sport; source: LapSource }) => {
  const summary = summarizeLaps(props.set);
  const recovery = METRIC_EXPLANATIONS.recovery;
  return (
    <div className="flex flex-col gap-3">
      <LapStrip set={props.set} size="detail" />
      <div className="flex flex-col gap-1 border-t border-white/10 pt-2.5">
        <LapExtreme
          label={m.ui_laps_fastest()}
          lap={summary.fastest}
          sport={props.sport}
          source={props.source}
        />
        <LapExtreme
          label={m.ui_laps_slowest()}
          lap={summary.slowest}
          sport={props.sport}
          source={props.source}
        />
        {summary.avgHrRecovery !== undefined && (
          <KeyValue
            interactive
            label={
              <>
                <Typography variant="caption">{recovery.friendlyName}</Typography>
                <MetricLabel metricId="recovery" size="sm" iconOnly />
              </>
            }
            value={recoveryLabel(summary.avgHrRecovery)}
            detail={m.ui_laps_recovery_per_interval({
              values: summary.hrRecoveries.map((bpm) => bpmFmt.format(bpm)).join(' · '),
            })}
          />
        )}
      </div>
    </div>
  );
};

interface LapsRowProps {
  laps: SessionLap[];
  sport: Sport;
}

export const LapsRow = (props: LapsRowProps) => {
  const lapSource = useMapFocusStore((s) => s.lapSource);
  const sessionLaps = useDeferredValue(useMapFocusStore((s) => s.sessionLaps));

  let source = lapSource;
  if (source === 'device' && props.laps.length === 0) source = 'off';
  let set: LapSet | null = null;
  if (source !== 'off') set = sessionLaps;

  const labels = lapsRowLabels(source, set, props.sport);

  return (
    <CollapsibleListItem
      testId="laps-row"
      disabled={labels.disabled || set === null}
      avatar={<LapStrip set={set} size="avatar" />}
      primary={labels.primary}
      secondary={labels.secondary === '' ? undefined : labels.secondary}
    >
      {set !== null && <LapsDetails set={set} sport={props.sport} source={source} />}
    </CollapsibleListItem>
  );
};
