import type { FC } from 'react';
import type { ThresholdKey } from '@/types.ts';
import { PvStatTile } from '@pacevault/ui/components/pvStatTile/PvStatTile.tsx';
import { ThresholdSparkline } from './ThresholdSparkline.tsx';
import { ICON_BY_THRESHOLD_TILE, isEditable } from './thresholdIcons.ts';
import { useThresholdTileReading } from './hooks/useThresholdTileReading.ts';
import type { ThresholdHistories, ThresholdTileContext, TileScrub, TileSpec } from './types.ts';

interface ThresholdTileProps {
  tile: TileSpec;
  histories: ThresholdHistories;
  context: ThresholdTileContext;
  domain: [number, number];
  scrub: TileScrub | null;
  fresh: boolean;
  onScrub: (scrub: TileScrub | null) => void;
  onEdit: (key: ThresholdKey) => void;
}

export const ThresholdTile: FC<ThresholdTileProps> = (props) => {
  const reading = useThresholdTileReading({
    tile: props.tile,
    histories: props.histories,
    context: props.context,
    scrub: props.scrub,
    fresh: props.fresh,
  });
  const key = props.tile.key;
  const sparkline = (
    <ThresholdSparkline
      points={reading.points}
      domain={props.domain}
      today={props.context.today}
      color={props.tile.color}
      fresh={props.fresh}
      onScrub={(date) => {
        if (date === null) {
          props.onScrub(null);
        } else {
          props.onScrub({ key, date });
        }
      }}
    />
  );
  const shared = {
    title: props.tile.title(),
    icon: { icon: ICON_BY_THRESHOLD_TILE[key], color: props.tile.color },
    value: reading.value,
    unit: reading.unit,
    note: reading.note,
    style: reading.style,
  };
  if (!isEditable(key)) {
    return <PvStatTile {...shared}>{sparkline}</PvStatTile>;
  }
  return (
    <PvStatTile {...shared} onClick={() => props.onEdit(key)}>
      {sparkline}
    </PvStatTile>
  );
};
