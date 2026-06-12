import { Footprints, Bike } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Sport } from '@/packages/engine/types.ts';

export const sportIcon: Record<Sport, LucideIcon> = {
  running: Footprints,
  cycling: Bike,
};
