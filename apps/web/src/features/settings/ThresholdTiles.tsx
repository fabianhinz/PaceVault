import { useState, type FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { useUserStore, type ThresholdKey } from '@/store/user.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { PvCardHeader } from '@pacevault/ui/components/pvCardHeader/PvCardHeader.tsx';
import { formatNumber, formatPaceInput } from '@/lib/formatters.ts';
import { firstSessionDateOf, profileHistoryDomain } from '@/lib/profileHistory.ts';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
import { ThresholdTile } from './ThresholdTile.tsx';
import type { ThresholdTileKey } from './thresholdIcons.ts';
import type { ThresholdHistories, TileScrub, TileSpec } from './types.ts';

const formatInt = (value: number) => formatNumber(value);

const TILES: TileSpec[] = [
  {
    key: 'restHr',
    title: m.ui_thresholds_tile_rest_hr,
    color: tokens.chartHr,
    unit: 'bpm',
    format: formatInt,
  },
  {
    key: 'maxHr',
    title: m.ui_thresholds_tile_max_hr,
    color: tokens.chartHr,
    unit: 'bpm',
    format: formatInt,
  },
  {
    key: 'thresholdHr',
    title: m.ui_thresholds_tile_threshold_hr,
    color: tokens.chartHr,
    unit: 'bpm',
    format: formatInt,
  },
  {
    key: 'ftp',
    title: m.ui_thresholds_tile_ftp,
    color: tokens.chartPower,
    unit: 'W',
    format: formatInt,
  },
  {
    key: 'thresholdPace',
    title: m.ui_thresholds_tile_pace,
    color: tokens.chartPace,
    unit: '/km',
    format: formatPaceInput,
  },
  {
    key: 'weight',
    title: m.ui_thresholds_tile_weight,
    color: tokens.chartGrade,
    unit: 'kg',
    format: (value) => formatNumber(value, 'one-decimal'),
  },
  {
    key: 'wkg',
    title: m.ui_thresholds_tile_wkg,
    color: tokens.sportCycling,
    unit: 'W/kg',
    format: (value) => formatNumber(value, 'fixed-two-decimals'),
  },
];

interface ThresholdTilesProps {
  histories: ThresholdHistories;
  fresh: ThresholdTileKey[];
  onEdit: (key: ThresholdKey) => void;
}

export const ThresholdTiles: FC<ThresholdTilesProps> = (props) => {
  const firstSessionDate = useSessionsStore((s) => firstSessionDateOf(s.sessions));
  const profileCreatedAt = useUserStore((s) => s.profile?.createdAt);
  const [today] = useState(() => Date.now());
  const [scrub, setScrub] = useState<TileScrub | null>(null);

  const context = { firstSessionDate, createdAt: profileCreatedAt ?? today, today };
  const domain = profileHistoryDomain({ histories: Object.values(props.histories), context });

  return (
    <div>
      <PvCardHeader
        title={m.ui_thresholds_tiles_title()}
        subtitle={m.ui_thresholds_tiles_subtitle()}
      />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        {TILES.map((tile) => (
          <ThresholdTile
            key={tile.key}
            tile={tile}
            histories={props.histories}
            context={context}
            domain={domain}
            scrub={scrub}
            fresh={props.fresh.includes(tile.key)}
            onScrub={setScrub}
            onEdit={props.onEdit}
          />
        ))}
      </div>
    </div>
  );
};
