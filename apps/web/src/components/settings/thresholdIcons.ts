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
import type { ThresholdKey } from '@/types.ts';
import type { ThresholdTileKey } from './types.ts';

export const ICON_BY_THRESHOLD_TILE: Record<ThresholdTileKey, LucideIcon> = {
  restHr: HeartPulse,
  maxHr: Heart,
  thresholdHr: Activity,
  ftp: Zap,
  thresholdPace: Timer,
  weight: Weight,
  wkg: Gauge,
};

export const isEditable = (key: ThresholdTileKey): key is ThresholdKey => key !== 'wkg';
