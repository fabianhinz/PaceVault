import type { FC } from 'react';
import { Crown } from 'lucide-react';
import { PvPlotStripTile } from '@pacevault/ui/components/pvPlotStrip/PvPlotStripTile.tsx';
import type { PlotStripPosition } from '@pacevault/ui/components/pvPlotStrip/types.ts';
import type { StoredSegmentPass } from '@/lib/workers/segmentsContract.ts';
import { formatDate, formatRaceTime } from '@/lib/format/formatters.ts';
import { passChipLabel } from '@/microcopy/segments.ts';

interface PassTileProps {
  pass: StoredSegmentPass;
  position: PlotStripPosition;
  best: boolean;
  selected: boolean;
  onSelect: (sessionId: string) => void;
}

export const PassTile: FC<PassTileProps> = (props) => (
  <PvPlotStripTile
    testId="pass-chip"
    label={formatDate(props.pass.date, 'day-month')}
    accessibleLabel={passChipLabel({
      date: formatDate(props.pass.date),
      time: formatRaceTime(props.pass.durationSec),
      best: props.best,
    })}
    position={props.position}
    pressed={props.selected}
    onPress={() => props.onSelect(props.pass.sessionId)}
    tone={props.best ? 'best' : 'neutral'}
    markerIcon={props.best ? Crown : undefined}
  />
);
