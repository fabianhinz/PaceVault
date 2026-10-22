import {
  Activity,
  Gauge,
  Heart,
  HeartPulse,
  Timer,
  Weight,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { ThresholdKey } from '@/store/user.ts';

export type ThresholdTileKey = ThresholdKey | 'wkg';

export const THRESHOLD_TILE_ICONS: Record<ThresholdTileKey, LucideIcon> = {
  restHr: HeartPulse,
  maxHr: Heart,
  thresholdHr: Activity,
  ftp: Zap,
  thresholdPace: Timer,
  weight: Weight,
  wkg: Gauge,
};
