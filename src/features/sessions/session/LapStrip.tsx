import { cn } from '@/lib/utils.ts';
import type { LapSet } from '@/lib/lapSet.ts';
import type { LapAnalysis } from '@/lib/laps.ts';

const MANY_LAPS = 20;

const cellColor = (lap: LapAnalysis | undefined, position: number): string => {
  if (lap?.isPartial) return 'rgba(255,255,255,.3)';
  if (lap?.intensity === 'warmup' || lap?.intensity === 'cooldown') return 'rgba(255,255,255,.35)';
  if (lap && lap.intensity !== 'active') return 'rgba(255,255,255,.18)';
  if (position % 2 === 0) return 'rgba(255,255,255,.75)';
  return 'rgba(255,255,255,.5)';
};

export const LapStrip = (props: { set: LapSet | null; muted?: boolean }) => {
  const bands = props.set?.bands ?? [];
  const first = bands[0];
  const last = bands[bands.length - 1];
  const className = cn(
    'flex h-2 w-12 shrink-0 overflow-hidden rounded-full',
    props.muted && 'opacity-30 grayscale',
  );
  if (!props.set || !first || !last || last.to <= first.from) {
    return <span aria-hidden className={cn(className, 'bg-white/12')} />;
  }
  const byIndex = new Map(props.set.analysis.map((lap) => [lap.lapIndex, lap]));
  return (
    <span aria-hidden className={cn(className, bands.length <= MANY_LAPS && 'gap-px')}>
      {bands.map((band, position) => (
        <i
          key={band.lapIndex}
          className="block h-full"
          style={{
            flexGrow: band.to - band.from,
            flexBasis: 0,
            background: cellColor(byIndex.get(band.lapIndex), position),
          }}
        />
      ))}
    </span>
  );
};
