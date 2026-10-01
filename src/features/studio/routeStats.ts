import { formatDistance } from '@/lib/formatters.ts';
import type { StudioRoute } from '@/store/studio.ts';

export const formatRouteStatsLine = (route: StudioRoute): string => {
  const stats: string[] = [formatDistance(route.distance)];
  if (route.elevation) {
    stats.push(`+${Math.round(route.elevation.gain)} m`);
  }
  return stats.join(' · ');
};
