import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { RACE_DISTANCES } from '@pacevault/engine/types.ts';
import { DISTANCE_OPTIONS, isLongFormat } from '@/lib/raceTime.ts';
import { formatPaceInput, formatRaceTime } from '@/lib/formatters.ts';
import { useRacePredictor } from '@/features/labs/hooks/useRacePredictor.ts';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { PvCardHeader } from '@pacevault/ui/components/pvCardHeader/PvCardHeader.tsx';
import { PvInput } from '@pacevault/ui/components/pvInput/PvInput.tsx';
import { PvLabel } from '@pacevault/ui/components/pvLabel/PvLabel.tsx';
import { PvDataTable } from '@pacevault/ui/components/pvDataTable/PvDataTable.tsx';
import { PvList } from '@pacevault/ui/components/pvList/PvList.tsx';
import { PvListItem } from '@pacevault/ui/components/pvList/PvListItem.tsx';
import { PvSelect } from '@pacevault/ui/components/pvSelect/PvSelect.tsx';
import { PvSelectTrigger } from '@pacevault/ui/components/pvSelect/PvSelectTrigger.tsx';
import { PvSelectValue } from '@pacevault/ui/components/pvSelect/PvSelectValue.tsx';
import { PvSelectContent } from '@pacevault/ui/components/pvSelect/PvSelectContent.tsx';
import { PvSelectItem } from '@pacevault/ui/components/pvSelect/PvSelectItem.tsx';
import { MetricLabel } from '@/components/MetricLabel.tsx';
import { METRIC_EXPLANATIONS } from '@/lib/explanations.ts';

export const RacePredictor: FC = () => {
  const predictor = useRacePredictor();

  return (
    <PvCard>
      <PvCardHeader title={m.ui_labs_predictor_title()} subtitle={m.ui_labs_predictor_subtitle()} />

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <PvLabel>{m.ui_pace_est_distance()}</PvLabel>
            <PvSelect value={predictor.distance} onValueChange={predictor.handleDistanceChange}>
              <PvSelectTrigger>
                <PvSelectValue />
              </PvSelectTrigger>
              <PvSelectContent>
                {DISTANCE_OPTIONS.map((opt) => (
                  <PvSelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </PvSelectItem>
                ))}
              </PvSelectContent>
            </PvSelect>
          </div>

          <div>
            <PvLabel>{m.ui_pace_est_race_time_short()}</PvLabel>
            <PvInput
              type="text"
              placeholder={isLongFormat(predictor.distance) ? '1:45:00' : '20:00'}
              helperText={isLongFormat(predictor.distance) ? 'h:mm:ss' : 'mm:ss'}
              value={predictor.timeInput}
              onChange={(e) => predictor.setTimeInput(e.target.value)}
            />
          </div>
        </div>

        <PvDataTable
          data={RACE_DISTANCES.map((key) => ({ key, pred: predictor.predictions?.[key] }))}
          rowKey={(row) => row.key}
          rowLabel={(row) => DISTANCE_OPTIONS.find((opt) => opt.value === row.key)?.label}
          fields={[
            {
              label: m.ui_labs_predictor_time(),
              value: (row) => (row.pred ? formatRaceTime(row.pred.timeSec) : '--'),
            },
            {
              label: m.ui_labs_predictor_pace(),
              value: (row) => (row.pred ? `${formatPaceInput(row.pred.paceSecPerKm)} /km` : '--'),
            },
          ]}
        />

        <PvList>
          <PvListItem
            primary={
              <span className="inline-flex items-center gap-1">
                VDOT <MetricLabel metricId="vdot" size="sm" contextLabel="VDOT" />
              </span>
            }
            secondary={METRIC_EXPLANATIONS.vdot.oneLiner}
          >
            {predictor.vdot?.toFixed(1) ?? '--'}
          </PvListItem>
        </PvList>
      </div>
    </PvCard>
  );
};
