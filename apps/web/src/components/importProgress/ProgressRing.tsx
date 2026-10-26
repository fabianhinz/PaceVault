import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import type { ForegroundImport } from '@/store/importProgress.ts';

const SIZE = 180;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface ProgressRingProps {
  foreground: ForegroundImport;
}

export const ProgressRing: FC<ProgressRingProps> = (props) => {
  const preparing = props.foreground.phase === 'preparing';
  let fraction = 0;
  if (props.foreground.total > 0) {
    fraction = Math.min(props.foreground.processed / props.foreground.total, 1);
  }
  let offset = CIRCUMFERENCE * (1 - fraction);
  if (preparing) offset = CIRCUMFERENCE * 0.75;

  return (
    <div className="relative size-180px">
      <svg width={SIZE} height={SIZE} className={cn('-rotate-90', preparing && 'animate-spin')}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-white/10"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className={cn(
            'stroke-accent',
            !preparing && 'transition-[stroke-dashoffset] duration-300',
          )}
        />
      </svg>

      {!preparing && (
        <div className="absolute inset-0 grid place-items-center">
          <PvTypography variant="h3" tabularNums>
            {m.ui_import_progress({
              processed: props.foreground.processed,
              total: props.foreground.total,
            })}
          </PvTypography>
        </div>
      )}
    </div>
  );
};
