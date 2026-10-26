import type { FC } from 'react';

interface LegendDotProps {
  color: string;
  opacity?: number;
  label: string;
}

export const LegendDot: FC<LegendDotProps> = (props) => (
  <span className="inline-flex items-center gap-1">
    <i
      className="inline-block size-2 rounded-xs"
      style={{ background: props.color, opacity: props.opacity }}
    />
    {props.label}
  </span>
);
