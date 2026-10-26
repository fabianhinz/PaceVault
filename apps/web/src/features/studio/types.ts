import type { StudioRoute } from '@/store/studio.ts';

export interface StudioTrackPickInfo {
  x: number;
  y: number;
  routeId: string;
  distanceM: number;
}

export interface StudioRoutesPopupInfo {
  x: number;
  y: number;
  routes: StudioRoute[];
}

export const HOVER_GROUP = 'studio-detail';
