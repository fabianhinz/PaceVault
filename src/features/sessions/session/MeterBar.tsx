import { cn } from '@/lib/utils.ts';
import type { Sport } from '@/packages/engine/types.ts';

type MeterAlpha = 50 | 75;

const FILL_CLASS: Record<Sport, Record<MeterAlpha, string>> = {
  running: { 50: 'bg-sport-running/50', 75: 'bg-sport-running/75' },
  cycling: { 50: 'bg-sport-cycling/50', 75: 'bg-sport-cycling/75' },
};

interface MeterBarProps {
  sport: Sport;
  fill: { from?: number; to: number };
  tick?: number;
  mark?: number;
  alpha: MeterAlpha;
}

const percent = (fraction: number): string => `${Math.max(0, Math.min(1, fraction)) * 100}%`;

export const MeterBar = (props: MeterBarProps) => {
  const from = props.fill.from ?? 0;
  return (
    <div className="relative flex h-6 w-full items-center">
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={cn('absolute inset-y-0 rounded-full', FILL_CLASS[props.sport][props.alpha])}
          style={{ left: percent(from), width: percent(props.fill.to - from) }}
        />
      </div>
      {props.tick !== undefined && (
        <div
          className="absolute h-2.5 w-0.5 -translate-x-1/2 rounded-full bg-text-primary"
          style={{ left: percent(props.tick) }}
        />
      )}
      {props.mark !== undefined && (
        <div
          className="absolute h-2.5 w-px -translate-x-1/2 bg-white/40"
          style={{ left: percent(props.mark) }}
        />
      )}
    </div>
  );
};
