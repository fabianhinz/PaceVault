import type { StudioRouteColor } from '@/store/studio.ts';

interface RouteColorValue {
  rgb: [number, number, number];
  hex: string;
}

export const routeColors: Record<StudioRouteColor, RouteColorValue> = {
  fuchsia: { rgb: [232, 121, 249], hex: '#e879f9' },
  emerald: { rgb: [52, 211, 153], hex: '#34d399' },
  amber: { rgb: [251, 191, 36], hex: '#fbbf24' },
  violet: { rgb: [167, 139, 250], hex: '#a78bfa' },
  orange: { rgb: [249, 115, 22], hex: '#f97316' },
  rose: { rgb: [251, 113, 133], hex: '#fb7185' },
};

export const routeColorOrder = Object.keys(routeColors) as StudioRouteColor[];

export const nextRouteColor = (used: StudioRouteColor[]): StudioRouteColor => {
  const counts = new Map<StudioRouteColor, number>();
  for (const color of used) counts.set(color, (counts.get(color) ?? 0) + 1);

  let next = routeColorOrder[0] as StudioRouteColor;
  for (const color of routeColorOrder) {
    if ((counts.get(color) ?? 0) < (counts.get(next) ?? 0)) next = color;
  }
  return next;
};
