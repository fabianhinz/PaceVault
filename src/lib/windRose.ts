import type { RelativeWind } from '@/packages/engine/windExposure.ts';

const WIND_ROSE_SECTORS = 16;

export const WIND_ROSE_SECTOR_DEG = 360 / WIND_ROSE_SECTORS;

export const windRoseSectorAngle = (sector: number): number => {
  const center = sector * WIND_ROSE_SECTOR_DEG;
  return Math.min(center, 360 - center);
};

export const windRoseShares = (relative: Array<RelativeWind | undefined>): number[] | null => {
  const seconds: number[] = Array.from({ length: WIND_ROSE_SECTORS }, () => 0);
  let total = 0;
  for (const entry of relative) {
    if (entry === undefined) continue;
    const clockwise = (entry.angle + 360) % 360;
    const sector = Math.round(clockwise / WIND_ROSE_SECTOR_DEG) % WIND_ROSE_SECTORS;
    seconds[sector] = (seconds[sector] ?? 0) + entry.seconds;
    total += entry.seconds;
  }
  if (total <= 0) return null;
  return seconds.map((value) => value / total);
};
