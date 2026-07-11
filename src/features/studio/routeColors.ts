import type { StudioRouteColor } from '@/store/studio.ts';

interface RouteColorValue {
  rgb: [number, number, number];
  hex: string;
}

export const DEFAULT_ROUTE_COLOR: StudioRouteColor = 'sky';

export const routeColorOrder: StudioRouteColor[] = [
  'sky',
  'emerald',
  'amber',
  'rose',
  'violet',
  'cyan',
];

export const routeColors: Record<StudioRouteColor, RouteColorValue> = {
  sky: { rgb: [56, 189, 248], hex: '#38bdf8' },
  emerald: { rgb: [52, 211, 153], hex: '#34d399' },
  amber: { rgb: [251, 191, 36], hex: '#fbbf24' },
  rose: { rgb: [251, 113, 133], hex: '#fb7185' },
  violet: { rgb: [167, 139, 250], hex: '#a78bfa' },
  cyan: { rgb: [34, 211, 238], hex: '#22d3ee' },
};
