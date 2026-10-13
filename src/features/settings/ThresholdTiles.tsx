import { useState, type ReactNode } from 'react';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { valueAt, type DatedValue } from '@/packages/engine/datedValue.ts';
import { useUserStore, type ThresholdKey } from '@/store/user.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { StatTile } from '@/components/ui/StatTile.tsx';
import { formatPaceInput, formatShortDate } from '@/lib/formatters.ts';
import {
  firstSessionDateOf,
  profileHistoryDomain,
  profileHistorySeries,
} from '@/lib/profileHistory.ts';
import { tokens } from '@/lib/tokens.ts';
import { ThresholdSparkline } from './ThresholdSparkline.tsx';
import { THRESHOLD_TILE_ICONS, type ThresholdTileKey } from './thresholdIcons.ts';

interface TileSpec {
  key: ThresholdTileKey;
  title: () => string;
  color: string;
  unit: string;
  format: (value: number) => string;
}

interface ThresholdTilesProps {
  histories: Record<ThresholdTileKey, DatedValue<number>[]>;
  fresh: ThresholdTileKey[];
  onEdit: (key: ThresholdKey) => void;
  mode: 'create' | 'update';
}

const MISSING = '--';

const intFmt = new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 });
const weightFmt = new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 1 });
const wkgFmt = new Intl.NumberFormat(getLocale(), {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatInt = (value: number) => intFmt.format(value);

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
    format: (value) => weightFmt.format(value),
  },
  {
    key: 'wkg',
    title: m.ui_thresholds_tile_wkg,
    color: tokens.sportCycling,
    unit: 'W/kg',
    format: (value) => wkgFmt.format(value),
  },
];

const addCaption = (key: ThresholdTileKey, histories: ThresholdTilesProps['histories']): string => {
  if (key === 'restHr') return m.ui_thresholds_add_rest_hr();
  if (key === 'maxHr') return m.ui_thresholds_add_max_hr();
  if (key === 'ftp') return m.ui_thresholds_add_ftp();
  if (key === 'weight') return m.ui_thresholds_add_weight();
  if (key === 'thresholdPace') return m.ui_thresholds_add_pace();
  const noFtp = histories.ftp.length === 0;
  if (noFtp && histories.weight.length === 0) return m.ui_thresholds_add_ftp_weight();
  if (noFtp) return m.ui_thresholds_add_ftp();
  return m.ui_thresholds_add_weight();
};

const isEditable = (key: ThresholdTileKey): key is ThresholdKey => key !== 'wkg';

export const ThresholdTiles = (props: ThresholdTilesProps) => {
  const firstSessionDate = useSessionsStore((s) => firstSessionDateOf(s.sessions));
  const profileCreatedAt = useUserStore((s) => s.profile?.createdAt);
  const [today] = useState(() => Date.now());
  const [scrub, setScrub] = useState<{ key: ThresholdTileKey; date: number } | null>(null);

  const context = { firstSessionDate, createdAt: profileCreatedAt ?? today, today };
  const domain = profileHistoryDomain(Object.values(props.histories), context);

  return (
    <div>
      <CardHeader
        title={m.ui_thresholds_tiles_title()}
        subtitle={m.ui_thresholds_tiles_subtitle()}
      />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        {TILES.map((tile) => {
          const history = props.histories[tile.key];
          const points = profileHistorySeries(history, context).points;
          const fresh = props.fresh.includes(tile.key);
          let shownValue = valueAt(points, today);
          let note: ReactNode = undefined;
          const scrubDate = scrub?.key === tile.key ? scrub.date : undefined;
          if (points.length === 0) {
            note = addCaption(tile.key, props.histories);
          } else if (scrubDate !== undefined) {
            shownValue = valueAt(points, scrubDate);
            const entryDate = valueAt(
              points.map((point) => ({ date: point.date, value: point.date })),
              scrubDate,
            );
            if (entryDate !== undefined) note = formatShortDate(entryDate);
          } else if (points.length > 1) {
            const latest = points.at(-1);
            if (latest !== undefined) note = formatShortDate(latest.date);
          }
          let value = MISSING;
          let unit: string | undefined = undefined;
          if (shownValue !== undefined) {
            value = tile.format(shownValue);
            unit = tile.unit;
          }
          let style = undefined;
          if (fresh) style = { boxShadow: `0 0 0 1px ${tile.color}aa` };
          const key = tile.key;
          const sparkline = (
            <ThresholdSparkline
              points={points}
              domain={domain}
              today={today}
              color={tile.color}
              fresh={fresh}
              onScrub={(date) => {
                if (props.mode === 'create') return;
                if (date === null) {
                  setScrub(null);
                } else {
                  setScrub({ key, date });
                }
              }}
            />
          );
          const shared = {
            title: tile.title(),
            icon: { icon: THRESHOLD_TILE_ICONS[key], color: tile.color },
            required: props.mode === 'create' && (key === 'restHr' || key === 'maxHr'),
            value,
            unit,
            note,
            style,
          };
          if (!isEditable(key)) {
            return (
              <StatTile key={key} {...shared}>
                {sparkline}
              </StatTile>
            );
          }
          return (
            <StatTile key={key} {...shared} onClick={() => props.onEdit(key)}>
              {sparkline}
            </StatTile>
          );
        })}
      </div>
    </div>
  );
};
