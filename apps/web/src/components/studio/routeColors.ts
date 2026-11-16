import { tokens } from '@pacevault/ui/lib/tokens.ts';
import { rgbChannels } from '@/components/mapBackground/trackColors.ts';
import type { StudioRouteColor } from '@/types.ts';

interface RouteColorValue {
  rgb: [number, number, number];
  hex: string;
}

const routeColor = (hex: string): RouteColorValue => ({ rgb: rgbChannels(hex), hex });

export const COLORS_BY_STUDIO_ROUTE_COLOR: Record<StudioRouteColor, RouteColorValue> = {
  fuchsia: routeColor(tokens.routeFuchsia),
  emerald: routeColor(tokens.routeEmerald),
  amber: routeColor(tokens.routeAmber),
  violet: routeColor(tokens.routeViolet),
  orange: routeColor(tokens.routeOrange),
  rose: routeColor(tokens.routeRose),
};

export const routeColorOrder = Object.keys(COLORS_BY_STUDIO_ROUTE_COLOR) as StudioRouteColor[];

export const nextRouteColor = (used: StudioRouteColor[]): StudioRouteColor => {
  const counts = new Map<StudioRouteColor, number>();
  for (const color of used) counts.set(color, (counts.get(color) ?? 0) + 1);

  let next = routeColorOrder[0] as StudioRouteColor;
  for (const color of routeColorOrder) {
    if ((counts.get(color) ?? 0) < (counts.get(next) ?? 0)) next = color;
  }
  return next;
};
