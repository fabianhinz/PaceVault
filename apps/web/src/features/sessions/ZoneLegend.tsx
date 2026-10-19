import { PaceRange } from '@/components/PaceRange.tsx';
import type { RunningZone, RunningZoneName } from '@pacevault/engine/types.ts';
import { m } from '@pacevault/i18n/messages.js';

const ZONE_LABELS: Record<RunningZoneName, () => string> = {
  recovery: m.ui_zone_recovery,
  easy: m.ui_zone_easy,
  tempo: m.ui_zone_tempo,
  threshold: m.ui_zone_threshold,
  vo2max: m.ui_zone_vo2max,
};

export const ZoneLegend = (props: { zones: RunningZone[]; compact?: boolean }) => {
  return (
    <div
      className={props.compact ? 'flex flex-nowrap overflow-x-auto gap-1' : 'flex flex-wrap gap-2'}
    >
      {props.zones.map((zone) => (
        <span
          key={zone.name}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 text-xs text-text-secondary whitespace-nowrap"
        >
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: zone.color }} />
          {ZONE_LABELS[zone.name]?.() ?? zone.label}
          {!props.compact && <PaceRange minPace={zone.minPace} maxPace={zone.maxPace} />}
        </span>
      ))}
    </div>
  );
};
