import type { FC } from 'react';

interface LegendLineProps {
  color: string;
  dashed?: boolean;
  label: string;
}

export const LegendLine: FC<LegendLineProps> = (props) => (
  <span className="inline-flex items-center gap-1.5">
    <span
      className="w-3.5 border-t-2"
      style={{ borderColor: props.color, borderTopStyle: props.dashed ? 'dashed' : 'solid' }}
    />
    {props.label}
  </span>
);
