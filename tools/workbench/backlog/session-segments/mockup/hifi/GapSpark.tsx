import type { FC } from 'react';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
import type { Pass } from './data.ts';

const WIDTH = 100;
const HEIGHT = 30;
const PADDING = 2;

interface GapSparkProps {
  pass: Pass;
  best: Pass;
  range: [number, number];
  color: string;
}

export const gapValues = ({ pass, best }: { pass: Pass; best: Pass }) =>
  pass.splitSeconds.map((seconds, i) => (best.splitSeconds[i] ?? 0) - seconds);

export const GapSpark: FC<GapSparkProps> = (props) => {
  const values = gapValues({ pass: props.pass, best: props.best });
  const span = props.range[1] - props.range[0];
  const y = (value: number) => {
    if (span === 0) return HEIGHT / 2;
    return HEIGHT - PADDING - ((value - props.range[0]) / span) * (HEIGHT - 2 * PADDING);
  };
  const points = values.map((v, i) => `${((i / Math.max(1, values.length - 1)) * WIDTH).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="block h-30px w-full" aria-hidden>
      <line x1={0} x2={WIDTH} y1={y(0)} y2={y(0)} stroke={tokens.textTertiary} strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
      <polyline points={points} fill="none" stroke={props.color} strokeWidth={1.6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};
