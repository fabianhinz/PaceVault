import type { FC } from 'react';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { Sport } from '@pacevault/engine/types.ts';

type MeterAlpha = 50 | 75;

const FILL_CLASS_BY_SPORT: Record<Sport, Record<MeterAlpha, string>> = {
  running: { 50: 'bg-sport-running/50', 75: 'bg-sport-running/75' },
  cycling: { 50: 'bg-sport-cycling/50', 75: 'bg-sport-cycling/75' },
};

const percent = (fraction: number): string => `${Math.max(0, Math.min(1, fraction)) * 100}%`;

interface MeterBarProps {
  sport: Sport;
  fill: { from?: number; to: number };
  tick?: number;
  mark?: number;
  alpha: MeterAlpha;
}

export const MeterBar: FC<MeterBarProps> = (props) => {
  const from = props.fill.from ?? 0;
  return (
    <div className="relative h-1.5 w-full rounded-full bg-white/5">
      <div
        className={cn(
          'absolute inset-y-0 rounded-full',
          FILL_CLASS_BY_SPORT[props.sport][props.alpha],
        )}
        style={{ left: percent(from), width: percent(props.fill.to - from) }}
      />
      {props.tick !== undefined && (
        <div
          className="absolute top-1/2 h-2.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-text-primary"
          style={{ left: percent(props.tick) }}
        />
      )}
      {props.mark !== undefined && (
        <div
          className="absolute top-1/2 h-2.5 w-px -translate-x-1/2 -translate-y-1/2 bg-white/40"
          style={{ left: percent(props.mark) }}
        />
      )}
    </div>
  );
};
