import type { ReactNode } from 'react';
import { Crumbs, StatTile } from '@pacevault/ui/components/StatTile.tsx';
import { MetricLabel } from '@/components/MetricLabel.tsx';
import { pickZone, type MoreStats } from '@/lib/moreStats.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { m } from '@pacevault/i18n/messages.js';
import { zoneLabel, zoneName } from '../charts/zoneLabel.ts';
import { useMiniRailHover } from './hooks/useMiniRailHover.ts';
import { duration, percent } from './statFormat.ts';

interface HrZonesCellProps {
  zones: NonNullable<MoreStats['hrZones']>;
}

export const HrZonesCell = (props: HrZonesCellProps) => {
  const rail = useMiniRailHover();
  const pick = pickZone(props.zones, rail.index);
  if (!pick) return null;

  let note: ReactNode = `${percent(pick.share)} %`;
  if (pick.active) {
    const crumbs: ReactNode[] = [duration(pick.zone.seconds)];
    const name = zoneName(pick.zone);
    if (name !== undefined) crumbs.push(name);
    note = <Crumbs items={crumbs} />;
  }

  return (
    <StatTile
      title={m.ui_more_stats_zones()}
      stat="trainingZones"
      info={<MetricLabel metricId="trainingZones" size="sm" iconOnly className="self-center" />}
      value={pick.zone.zone}
      note={note}
    >
      <div className="flex h-4 w-full overflow-hidden rounded-md bg-white/5" {...rail.railProps}>
        {props.zones.zones.map((zone, i) => (
          <span
            key={zone.zone}
            role="img"
            aria-label={m.ui_more_stats_zone_aria({
              zone: zoneLabel(zone),
              time: duration(zone.seconds),
              percent: percent(zone.seconds / props.zones.totalSeconds),
            })}
            className={cn(
              'block h-full cursor-pointer transition-opacity',
              pick.active && i !== pick.index && 'opacity-30',
            )}
            style={{
              width: `${(zone.seconds / props.zones.totalSeconds) * 100}%`,
              backgroundColor: zone.color,
            }}
            {...rail.segmentProps(i)}
          />
        ))}
      </div>
    </StatTile>
  );
};
