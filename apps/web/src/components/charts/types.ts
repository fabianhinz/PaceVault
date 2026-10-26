import type { ReactNode } from 'react';
import type { StatRailNote } from '@pacevault/ui/components/pvStatRail/types.ts';

export interface RailReading {
  value: ReactNode;
  secondary?: ReactNode;
  note?: StatRailNote;
}

export interface AreaShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}
