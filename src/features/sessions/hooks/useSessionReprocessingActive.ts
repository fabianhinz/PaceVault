import { isSessionOutdated } from '@/packages/engine/sessionDerivation.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';

export const useSessionReprocessingActive = (): boolean => {
  const phase = useSessionReprocessingStore((s) => s.phase);
  const hasOutdatedSessions = useSessionsStore((s) => s.sessions.some(isSessionOutdated));
  if (phase === 'waiting' || phase === 'running') return true;
  return phase === 'pending' && hasOutdatedSessions;
};
