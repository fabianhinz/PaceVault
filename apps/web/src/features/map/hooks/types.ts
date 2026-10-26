import type { PickingInfo } from '@deck.gl/core';
import type { SessionGPS, Sport, TrainingSession } from '@pacevault/engine/types.ts';

export interface MapTrack {
  sessionId: string;
  sport: Sport;
  gps: SessionGPS;
  session: TrainingSession;
}

export type PickHandler = (info: PickingInfo, event: unknown) => boolean | void;

export interface DeckEventHandlers {
  onClick?: PickHandler;
  onHover?: PickHandler;
}
