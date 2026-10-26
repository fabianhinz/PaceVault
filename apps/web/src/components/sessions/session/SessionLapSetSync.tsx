import type { FC } from 'react';
import type { SessionLap, SessionRecord } from '@pacevault/engine/types.ts';
import { useSessionLapsEffect } from './hooks/useSessionLapsEffect.ts';

interface SessionLapSetSyncProps {
  records: SessionRecord[];
  laps: SessionLap[];
}

export const SessionLapSetSync: FC<SessionLapSetSyncProps> = (props) => {
  useSessionLapsEffect({ records: props.records, laps: props.laps });
  return null;
};
