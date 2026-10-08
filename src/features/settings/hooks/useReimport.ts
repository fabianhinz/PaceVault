import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '@/store/user.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import {
  getFitFile,
  getFitFileSessionIds,
  deleteSessionRecords,
  deleteSessionLaps,
  deleteSessionGPS,
  saveSessionRecords,
  saveSessionLaps,
} from '@/lib/indexeddb.ts';
import { parseFitFile } from '@/parsers/fit.ts';
import { toFitParseProfile } from '@/lib/fitParseProfile.ts';
import { toast } from '@/components/ui/toastStore.ts';
import { m } from '@/paraglide/messages.js';
import { useCoachPlanStore } from '@/store/coachPlan.ts';
import type { SessionFields } from '@/packages/engine/types.ts';
import type { UserProfile } from '@/types/index.ts';
import { invalidatePersonalBests } from '@/features/records/hooks/usePersonalBests.ts';

const reimportSession = async (
  sessionId: string,
  profile: UserProfile,
): Promise<SessionFields | undefined> => {
  const fitFile = await getFitFile(sessionId);
  if (!fitFile) return undefined;
  const result = await parseFitFile(fitFile.data, fitFile.fileName, toFitParseProfile(profile));

  await deleteSessionRecords(sessionId);
  await deleteSessionLaps(sessionId);
  await deleteSessionGPS(sessionId);

  await saveSessionRecords(sessionId, result.records);
  await saveSessionLaps(sessionId, result.laps);

  return result.session;
};

interface ReimportState {
  reimporting: boolean;
  processed: number;
  total: number;
}

export const useReimport = () => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ReimportState>({
    reimporting: false,
    processed: 0,
    total: 0,
  });

  const reimportAll = useCallback(async () => {
    const profile = useUserStore.getState().profile;
    if (!profile) {
      toast(m.toast_reimport_no_profile_title(), m.toast_reimport_no_profile_desc(), 'error');
      return;
    }

    setState({ reimporting: true, processed: 0, total: 0 });

    const sessionIds = await getFitFileSessionIds();
    if (sessionIds.length === 0) {
      toast(m.toast_reimport_no_files_title(), m.toast_reimport_no_files_desc(), 'warning');
      setState({ reimporting: false, processed: 0, total: 0 });
      return;
    }

    setState((prev) => ({ ...prev, total: sessionIds.length }));

    const updates: Array<{
      id: string;
      session: SessionFields;
    }> = [];
    let failed = 0;

    for (const sessionId of sessionIds) {
      try {
        const session = await reimportSession(sessionId, profile);
        if (session) updates.push({ id: sessionId, session });
      } catch (err) {
        console.error(`Reimport failed for session ${sessionId}:`, err);
        failed++;
      }

      setState((prev) => ({ ...prev, processed: prev.processed + 1 }));
    }

    if (updates.length > 0) {
      useSessionsStore.getState().replaceSessions(updates);
      useCoachPlanStore.getState().clearPlan();
      invalidatePersonalBests(queryClient);
    }

    setState({ reimporting: false, processed: 0, total: 0 });

    const parts: string[] = [];
    if (updates.length > 0) {
      let reimportMsg = m.toast_reimport_sessions_plural({ count: updates.length });
      if (updates.length === 1) {
        reimportMsg = m.toast_reimport_sessions({ count: updates.length });
      }
      parts.push(reimportMsg);
    }
    if (failed > 0) {
      parts.push(m.toast_reimport_failed({ count: failed }));
    }
    let reimportVariant: 'success' | 'error' = 'success';
    if (failed > 0) {
      reimportVariant = 'error';
    }
    toast(m.toast_reimport_complete_title(), parts.join(', '), reimportVariant);
  }, [queryClient]);

  return {
    reimporting: state.reimporting,
    processed: state.processed,
    total: state.total,
    reimportAll,
  };
};
