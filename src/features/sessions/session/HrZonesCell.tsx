import { pickZone, type MoreStats } from '@/lib/moreStats.ts';
import { cn } from '@/lib/utils.ts';
import { m } from '@/paraglide/messages.js';
import { zoneLabel, zoneName } from '../charts/zoneLabel.ts';
import { useMiniRailHover } from './hooks/useMiniRailHover.ts';
import { StatCaption, StatCell, StatValue } from './StatCell.tsx';
import { duration, percent } from './statFormat.ts';

interface HrZonesCellProps {
  zones: NonNullable<MoreStats['hrZones']>;
}

export const HrZonesCell = (props: HrZonesCellProps) => {
  const rail = useMiniRailHover();
  const pick = pickZone(props.zones, rail.index);
  if (!pick) return null;

  let unit: string | undefined = undefined;
  let info2 = `${percent(pick.share)} %`;
  if (pick.active) {
    unit = zoneName(pick.zone);
    info2 = duration(pick.zone.seconds);
  }

  return (
    <StatCell
      stat="zones"
      label={m.ui_more_stats_zones()}
      metricId="trainingZones"
      active={pick.active}
      info1={<StatValue value={pick.zone.zone} unit={unit} />}
      info2={<StatCaption>{info2}</StatCaption>}
      chart={
        <div className="flex h-8 w-full items-center" {...rail.railProps}>
          <div className="flex h-6 w-full overflow-hidden rounded-md bg-white/5">
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
        </div>
      }
    />
  );
};
