import type { FC } from 'react';
import { windColorAt } from '@/lib/colors/zoneColors.ts';
import {
  WIND_ROSE_SECTOR_DEG,
  windRoseSectorAngle,
} from '@/components/sessions/session/windRoseSectors.ts';

const HALF_SECTOR_RAD = ((WIND_ROSE_SECTOR_DEG / 2) * Math.PI) / 180;

const point = ({
  center,
  angle,
  radius,
}: {
  center: number;
  angle: number;
  radius: number;
}): string =>
  `${(center + Math.sin(angle) * radius).toFixed(1)},${(center - Math.cos(angle) * radius).toFixed(1)}`;

const wedgePath = ({
  center,
  sector,
  inner,
  outer,
}: {
  center: number;
  sector: number;
  inner: number;
  outer: number;
}): string => {
  const mid = (sector * WIND_ROSE_SECTOR_DEG * Math.PI) / 180;
  const a0 = mid - HALF_SECTOR_RAD;
  const a1 = mid + HALF_SECTOR_RAD;
  const arc = `L${point({ center, angle: a0, radius: outer })} A${outer} ${outer} 0 0 1 ${point({ center, angle: a1, radius: outer })}`;
  if (inner === 0) return `M${center},${center} ${arc} Z`;
  return `M${point({ center, angle: a0, radius: inner })} ${arc} L${point({ center, angle: a1, radius: inner })} A${inner} ${inner} 0 0 0 ${point({ center, angle: a0, radius: inner })} Z`;
};

interface WedgesProps {
  shares: number[];
  center: number;
  inner: number;
  outer: number;
}

export const Wedges: FC<WedgesProps> = (props) => {
  const max = Math.max(...props.shares);
  if (max <= 0) return null;
  return props.shares.map((share, sector) => {
    if (share <= 0) return null;
    const radius = props.inner + (share / max) * (props.outer - props.inner);
    return (
      <path
        key={sector}
        d={wedgePath({ center: props.center, sector, inner: props.inner, outer: radius })}
        fill={windColorAt(windRoseSectorAngle(sector))}
        fillOpacity={0.9}
      />
    );
  });
};
