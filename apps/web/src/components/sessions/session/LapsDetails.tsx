import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { MetricLabel } from '@/components/metricLabel/index.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { EXPLANATION_BY_METRIC } from '@/components/metricLabel/explanations.ts';
import { formatNumber } from '@/lib/format/formatters.ts';
import { summarizeLaps, effortWorkSet, type LapSet, type LapSource } from '@/lib/analysis/laps.ts';
import type { Sport } from '@pacevault/engine/types.ts';
import { KeyValue } from './KeyValue.tsx';
import { LapExtreme } from './LapExtreme.tsx';
import { LapStrip } from './LapStrip.tsx';

const recoveryLabel = (avgBpm: number): string => {
  if (avgBpm > 25) return m.ui_stat_recovery_strong();
  if (avgBpm >= 15) return m.ui_stat_recovery_adequate();
  return m.ui_stat_recovery_slow();
};

interface LapsDetailsProps {
  set: LapSet;
  sport: Sport;
  source: LapSource;
}

export const LapsDetails: FC<LapsDetailsProps> = (props) => {
  let summarySet = props.set;
  if (props.source === 'efforts') summarySet = effortWorkSet(props.set);
  const summary = summarizeLaps(summarySet);
  const recovery = EXPLANATION_BY_METRIC.recovery;
  return (
    <div className="flex flex-col gap-3">
      <LapStrip set={props.set} size="detail" />
      <div className="flex flex-col gap-1 border-t border-white/10 pt-2.5">
        <LapExtreme
          set={props.set}
          label={m.ui_laps_fastest()}
          lap={summary.fastest}
          sport={props.sport}
          source={props.source}
        />
        <LapExtreme
          set={props.set}
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
                <PvTypography variant="caption">{recovery.friendlyName}</PvTypography>
                <MetricLabel metricId="recovery" size="sm" iconOnly />
              </>
            }
            value={recoveryLabel(summary.avgHrRecovery)}
            detail={m.ui_laps_recovery_per_interval({
              values: summary.hrRecoveries.map((bpm) => formatNumber(bpm)).join(' · '),
            })}
          />
        )}
      </div>
    </div>
  );
};
