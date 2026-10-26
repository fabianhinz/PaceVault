import { formatDistance } from '@/lib/format/formatters.ts';
import type { StudioRoute } from '@/types.ts';

export const formatRouteStatsLine = (route: StudioRoute): string => {
  const stats: string[] = [formatDistance(route.distance)];
  if (route.elevation) {
    stats.push(`+${Math.round(route.elevation.gain)} m`);
  }
  return stats.join(' · ');
};
