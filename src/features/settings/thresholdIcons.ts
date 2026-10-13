import { Gauge, Heart, HeartPulse, Timer, Weight, Zap, type LucideIcon } from 'lucide-react';
import type { ThresholdKey } from '@/store/user.ts';

export type ThresholdTileKey = ThresholdKey | 'wkg';

export const THRESHOLD_TILE_ICONS: Record<ThresholdTileKey, LucideIcon> = {
  restHr: HeartPulse,
  maxHr: Heart,
  ftp: Zap,
  thresholdPace: Timer,
  weight: Weight,
  wkg: Gauge,
};
