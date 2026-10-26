import type { TrainingSession } from '@pacevault/engine/types.ts';

export interface PopupInfo {
  x: number;
  y: number;
  sessions: TrainingSession[];
}
