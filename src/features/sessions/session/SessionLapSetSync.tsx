import type { SessionLap, SessionRecord } from '@/packages/engine/types.ts';
import { useSessionLapsEffect } from './hooks/useSessionLapsEffect.ts';

interface SessionLapSetSyncProps {
  records: SessionRecord[];
  laps: SessionLap[];
}

export const SessionLapSetSync = (props: SessionLapSetSyncProps) => {
  useSessionLapsEffect(props.records, props.laps);
  return null;
};
