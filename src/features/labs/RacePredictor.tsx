import { m } from '@/paraglide/messages.js';
import type { RaceDistance } from '@/packages/engine/types.ts';
import { RACE_DISTANCE_METERS } from '@/packages/engine/vdot.ts';
import { DISTANCE_OPTIONS, usesLongFormat } from '@/lib/raceTime.ts';
import { formatPaceInput, formatRaceTime } from '@/lib/formatters.ts';
import { useRacePredictor } from '@/features/labs/hooks/useRacePredictor.ts';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Label } from '@/components/ui/Label.tsx';
import { DataTable } from '@/components/ui/DataTable.tsx';
import { List, ListItem } from '@/components/ui/List.tsx';
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select.tsx';
import { MetricLabel } from '@/components/ui/MetricLabel.tsx';
import { METRIC_EXPLANATIONS } from '@/lib/explanations.ts';

const DISTANCE_KEYS = Object.keys(RACE_DISTANCE_METERS) as RaceDistance[];

export const RacePredictor = () => {
  const predictor = useRacePredictor();

  return (
    <Card>
      <CardHeader title={m.ui_labs_predictor_title()} subtitle={m.ui_labs_predictor_subtitle()} />

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{m.ui_pace_est_distance()}</Label>
            <SelectRoot value={predictor.distance} onValueChange={predictor.handleDistanceChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISTANCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </div>

          <div>
            <Label>{m.ui_pace_est_race_time_short()}</Label>
            <Input
              type="text"
              placeholder={usesLongFormat(predictor.distance) ? '1:45:00' : '20:00'}
              helperText={usesLongFormat(predictor.distance) ? 'h:mm:ss' : 'mm:ss'}
              value={predictor.timeInput}
              onChange={(e) => predictor.setTimeInput(e.target.value)}
            />
          </div>
        </div>

        <DataTable
          data={DISTANCE_KEYS.map((key) => ({ key, pred: predictor.predictions?.[key] }))}
          rowKey={(row) => row.key}
          rowLabel={(row) => DISTANCE_OPTIONS.find((opt) => opt.value === row.key)?.label}
          fields={[
            {
              label: m.ui_labs_predictor_time(),
              value: (row) => (row.pred ? formatRaceTime(row.pred.timeSeconds) : '--'),
            },
            {
              label: m.ui_labs_predictor_pace(),
              value: (row) => (row.pred ? `${formatPaceInput(row.pred.paceSecPerKm)} /km` : '--'),
            },
          ]}
        />

        <List>
          <ListItem
            primary={
              <span className="inline-flex items-center gap-1">
                VDOT <MetricLabel metricId="vdot" size="sm" contextLabel="VDOT" />
              </span>
            }
            secondary={METRIC_EXPLANATIONS.vdot.oneLiner}
          >
            {predictor.vdot?.toFixed(1) ?? '--'}
          </ListItem>
        </List>
      </div>
    </Card>
  );
};
