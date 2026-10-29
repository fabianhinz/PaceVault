import type { FC } from 'react';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { LapSet, LapAnalysis } from '@/lib/analysis/laps.ts';
import { tokens } from '@pacevault/ui/lib/tokens.ts';

const MANY_LAPS = 20;

const cellColor = ({
  lap,
  position,
}: {
  lap: LapAnalysis | undefined;
  position: number;
}): string => {
  if (lap?.partial) return tokens.white30;
  if (lap?.intensity === 'warmup' || lap?.intensity === 'cooldown') return tokens.white35;
  if (lap?.intensity === 'steady') return tokens.white45;
  if (lap && lap.intensity !== 'active') return tokens.white18;
  if (position % 2 === 0) return tokens.white75;
  return tokens.white50;
};

interface LapSwatchProps {
  set: LapSet | null;
  muted?: boolean;
}

export const LapSwatch: FC<LapSwatchProps> = (props) => {
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
          className="block h-full basis-0"
          style={{
            flexGrow: band.to - band.from,
            background: cellColor({ lap: byIndex.get(band.lapIndex), position }),
          }}
        />
      ))}
    </span>
  );
};
