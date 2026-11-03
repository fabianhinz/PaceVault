import type { FC } from 'react';
import { tokens } from '@pacevault/ui/lib/tokens.ts';

export const TICK_FONT_SIZE = 11;

interface EdgeTickProps {
  x?: number;
  y?: number;
  payload?: { value: number };
  first: number;
  format: (value: number) => string;
}

export const EdgeTick: FC<EdgeTickProps> = (props) => {
  if (props.payload === undefined || props.x === undefined || props.y === undefined) return null;
  const anchor = props.payload.value === props.first ? 'start' : 'end';
  return (
    <text x={props.x} y={props.y} dy={TICK_FONT_SIZE} textAnchor={anchor} fill={tokens.textTertiary} fontSize={TICK_FONT_SIZE}>
      {props.format(props.payload.value)}
    </text>
  );
};
