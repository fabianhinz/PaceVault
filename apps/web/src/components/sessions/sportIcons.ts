import { Footprints, Bike } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Sport } from '@pacevault/engine/types.ts';

export const ICON_BY_SPORT: Record<Sport, LucideIcon> = {
  running: Footprints,
  cycling: Bike,
};
