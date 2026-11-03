import type { FC } from 'react';
import { tokens } from '@pacevault/ui/lib/tokens.ts';

const VIEW_WIDTH = 100;
const VIEW_HEIGHT = 30;
const VIEW_PADDING = 2;

interface PassGapSparkProps {
  gapsSec: number[];
  rangeSec: [number, number];
  color: string;
}

export const PassGapSpark: FC<PassGapSparkProps> = (props) => {
  const spanSec = props.rangeSec[1] - props.rangeSec[0];
  const y = (valueSec: number) => {
    if (spanSec === 0) return VIEW_HEIGHT / 2;
    return (
      VIEW_HEIGHT -
      VIEW_PADDING -
      ((valueSec - props.rangeSec[0]) / spanSec) * (VIEW_HEIGHT - 2 * VIEW_PADDING)
    );
  };
  const lastIndex = Math.max(1, props.gapsSec.length - 1);
  const points = props.gapsSec
    .map((gapSec, i) => `${((i / lastIndex) * VIEW_WIDTH).toFixed(1)},${y(gapSec).toFixed(1)}`)
    .join(' ');
  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      preserveAspectRatio="none"
      className="block h-30px w-full"
      aria-hidden
    >
      <line
        x1={0}
        x2={VIEW_WIDTH}
        y1={y(0)}
        y2={y(0)}
        stroke={tokens.textTertiary}
        strokeDasharray="2 2"
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        points={points}
        fill="none"
        stroke={props.color}
        strokeWidth={1.6}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};
