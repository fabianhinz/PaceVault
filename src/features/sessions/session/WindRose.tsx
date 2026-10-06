import { m } from '@/paraglide/messages.js';
import { windColorAt } from '@/lib/zoneColors.ts';
import { WIND_ROSE_SECTOR_DEG, windRoseSectorAngle } from '@/lib/windRose.ts';

const HALF_SECTOR_RAD = ((WIND_ROSE_SECTOR_DEG / 2) * Math.PI) / 180;

const point = (center: number, angle: number, radius: number): string =>
  `${(center + Math.sin(angle) * radius).toFixed(1)},${(center - Math.cos(angle) * radius).toFixed(1)}`;

const wedgePath = (center: number, sector: number, inner: number, outer: number): string => {
  const mid = (sector * WIND_ROSE_SECTOR_DEG * Math.PI) / 180;
  const a0 = mid - HALF_SECTOR_RAD;
  const a1 = mid + HALF_SECTOR_RAD;
  const arc = `L${point(center, a0, outer)} A${outer} ${outer} 0 0 1 ${point(center, a1, outer)}`;
  if (inner === 0) return `M${center},${center} ${arc} Z`;
  return `M${point(center, a0, inner)} ${arc} L${point(center, a1, inner)} A${inner} ${inner} 0 0 0 ${point(center, a0, inner)} Z`;
};

interface WedgesProps {
  shares: number[];
  center: number;
  inner: number;
  outer: number;
}

const Wedges = (props: WedgesProps) => {
  const max = Math.max(...props.shares);
  if (max <= 0) return null;
  return props.shares.map((share, sector) => {
    if (share <= 0) return null;
    const radius = props.inner + (share / max) * (props.outer - props.inner);
    return (
      <path
        key={sector}
        d={wedgePath(props.center, sector, props.inner, radius)}
        fill={windColorAt(windRoseSectorAngle(sector))}
        fillOpacity={0.9}
      />
    );
  });
};

export const WindRoseGlyph = (props: { shares: number[]; size: number }) => {
  const center = props.size / 2;
  const outer = center - 1;
  return (
    <svg
      width={props.size}
      height={props.size}
      viewBox={`0 0 ${props.size} ${props.size}`}
      aria-hidden
      className="shrink-0"
    >
      <circle cx={center} cy={center} r={outer} className="fill-white/5" />
      <Wedges shares={props.shares} center={center} inner={0} outer={outer} />
    </svg>
  );
};

export const WindRose = (props: { shares: number[]; size: number }) => {
  const center = props.size / 2;
  const inner = 10;
  const outer = center - 16;
  const labelClass = 'fill-text-tertiary text-[9px] uppercase tracking-wider';
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
