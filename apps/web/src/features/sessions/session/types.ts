import type { PointerEvent } from 'react';
import type { SessionLap, SessionRecord, Sport } from '@pacevault/engine/types.ts';

export interface MiniRailSegmentProps {
  onPointerEnter: (event: PointerEvent<HTMLElement>) => void;
  onClick: () => void;
}

export interface MiniRailProps {
  onPointerLeave: (event: PointerEvent<HTMLElement>) => void;
}

export interface LapsControlProps {
  records: SessionRecord[];
  laps: SessionLap[];
  sport: Sport;
  date: number;
}
