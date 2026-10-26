import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { Wedges } from '@/features/sessions/session/Wedges.tsx';

interface WindRoseProps {
  shares: number[];
  size: number;
}

export const WindRose: FC<WindRoseProps> = (props) => {
  const center = props.size / 2;
  const inner = 10;
  const outer = center - 16;
  const labelClass = 'fill-text-tertiary text-3xs uppercase tracking-wider';
  return (
    <svg
      width={props.size}
      height={props.size}
      viewBox={`0 0 ${props.size} ${props.size}`}
      role="img"
      aria-label={m.ui_weather_rose_label()}
      className="shrink-0"
    >
      {[0.5, 1].map((fraction) => (
        <circle
          key={fraction}
          cx={center}
          cy={center}
          r={inner + fraction * (outer - inner)}
          fill="none"
          className="stroke-white/10"
        />
      ))}
      <Wedges shares={props.shares} center={center} inner={inner} outer={outer} />
      <path
        d={`M${center} ${center - 6} L${center + 4} ${center + 5} L${center} ${center + 2} L${center - 4} ${center + 5} Z`}
        className="fill-text-primary"
      />
      <text x={center} y={9} textAnchor="middle" className={labelClass}>
        {m.ui_weather_headwind()}
      </text>
      <text x={center} y={props.size - 2} textAnchor="middle" className={labelClass}>
        {m.ui_weather_tailwind()}
      </text>
    </svg>
  );
};
