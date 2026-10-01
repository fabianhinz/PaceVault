import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { glassClass } from '@/components/ui/Card.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { DataTable } from '@/components/ui/DataTable.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { cn } from '@/lib/utils.ts';
import {
  formatDistance,
  formatElevation,
  formatLapTime,
  formatPaceOrSpeed,
} from '@/lib/formatters.ts';
import type { LapAnalysis, LapRecordEnrichment } from '@/lib/laps.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { m } from '@/paraglide/messages.js';

interface LapDetailTableProps {
  laps: LapAnalysis[];
  isRunning: boolean;
  enrichments?: Map<number, LapRecordEnrichment>;
}

const COLLAPSED_COUNT = 6;

export const LapDetailTable = (props: LapDetailTableProps) => {
  const [expanded, setExpanded] = useState(false);
  const hoveredLapIndex = useMapFocusStore((s) => s.hoveredLapIndex);
  const needsToggle = props.laps.length > COLLAPSED_COUNT;
  const visibleLaps = needsToggle && !expanded ? props.laps.slice(0, COLLAPSED_COUNT) : props.laps;

  const hasCadence = props.laps.some((l) => l.avgCadence !== undefined);
  const hasElevation = props.laps.some((l) => l.elevationGain !== undefined);
  const hasPower = props.enrichments
    ? [...props.enrichments.values()].some((e) => e.avgPower !== undefined)
    : false;

  return (
    <div className={cn(glassClass, 'rounded-2xl overflow-hidden')}>
      <div className="flex items-center px-4 py-2">
        <Typography variant="title" className="flex-1 text-left">
          {m.ui_laps_table_title()}
        </Typography>
        {needsToggle && (
          <Button variant="ghost" size="icon" onClick={() => setExpanded((prev) => !prev)}>
            <Typography variant="caption" color="textSecondary">
              ({props.laps.length})
            </Typography>
            <ChevronRight className={cn('size-4 transition-transform', expanded && 'rotate-90')} />
          </Button>
        )}
      </div>

      <DataTable
        className="px-3 pb-3"
        data={visibleLaps}
        rowKey={(lap) => lap.lapIndex}
        rowLabel={(lap) => `${lap.lapIndex + 1}`}
        onRowHover={(lap) => {
          if (lap) {
            useMapFocusStore.getState().setHoveredLapIndex(lap.lapIndex);
          } else {
            useMapFocusStore.getState().clearHoveredLapIndex();
          }
        }}
        rowClassName={(lap) =>
          cn(
            lap.intensity !== 'active' && 'text-text-quaternary',
            hoveredLapIndex === lap.lapIndex && 'bg-white/10',
          )
        }
        fields={[
          { label: m.ui_laps_col_distance(), value: (lap) => formatDistance(lap.distance) },
          { label: m.ui_laps_col_time(), value: (lap) => formatLapTime(lap.duration) },
          {
            label: props.isRunning ? m.ui_laps_col_pace() : m.ui_laps_col_speed(),
            value: (lap) => formatPaceOrSpeed(lap, props.isRunning),
          },
          {
            label: m.ui_laps_col_avg_hr(),
            value: (lap) => (lap.avgHr !== undefined ? `${lap.avgHr}` : '--'),
            priority: 'secondary',
          },
          {
            label: m.ui_laps_col_power(),
            value: (lap) => {
              const p = props.enrichments?.get(lap.lapIndex)?.avgPower;
              return p !== undefined ? `${p} W` : '--';
            },
            visible: hasPower,
            priority: 'secondary',
          },
          {
            label: m.ui_laps_col_cadence(),
            value: (lap) => (lap.avgCadence !== undefined ? `${lap.avgCadence}` : '--'),
            visible: hasCadence,
            priority: 'secondary',
          },
          {
            label: m.ui_laps_col_elev(),
            value: (lap) => formatElevation(lap.elevationGain),
            visible: hasElevation,
            priority: 'secondary',
          },
        ]}
      />
    </div>
  );
};
