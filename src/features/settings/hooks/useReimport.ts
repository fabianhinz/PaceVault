import { useState, useCallback } from 'react';
import { useUserStore } from '@/store/user.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import {
  getAllFitFiles,
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
import type { SessionRecord, Sport, TrainingSession } from '@/packages/engine/types.ts';
import { useFiltersStore } from '@/store/filters';

interface ReimportState {
  reimporting: boolean;
  processed: number;
  total: number;
}

export const useReimport = () => {
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

    const fitFiles = await getAllFitFiles();
    if (fitFiles.length === 0) {
      toast(m.toast_reimport_no_files_title(), m.toast_reimport_no_files_desc(), 'warning');
      setState({ reimporting: false, processed: 0, total: 0 });
      return;
    }

    setState((prev) => ({ ...prev, total: fitFiles.length }));

    const updates: Array<{
      id: string;
      session: Omit<TrainingSession, 'id' | 'createdAt'>;
    }> = [];
    const pbSessions: Array<{
      sessionId: string;
      date: number;
      sport: Sport;
      records: SessionRecord[];
      distance?: number;
      elevationGain?: number;
    }> = [];
    let failed = 0;

    for (const fitFile of fitFiles) {
      try {
        const result = await parseFitFile(
          fitFile.data,
          fitFile.fileName,
          toFitParseProfile(profile),
        );

        // Delete old IDB data for this session
        await deleteSessionRecords(fitFile.sessionId);
        await deleteSessionLaps(fitFile.sessionId);
        await deleteSessionGPS(fitFile.sessionId);

        // Save new records and laps with the original sessionId
        const recordsWithId = result.records.map((r) => ({
          ...r,
          sessionId: fitFile.sessionId,
        }));
        const lapsWithId = result.laps.map((l) => ({
          ...l,
          sessionId: fitFile.sessionId,
        }));

        await saveSessionRecords(recordsWithId);
        await saveSessionLaps(lapsWithId);

        updates.push({ id: fitFile.sessionId, session: result.session });

        if (result.records.length > 0) {
          pbSessions.push({
            sessionId: fitFile.sessionId,
            date: result.session.date,
            sport: result.session.sport,
            records: result.records,
            distance: result.session.distance,
            elevationGain: result.session.elevationGain,
          });
        }
      } catch (err) {
        console.error(`Reimport failed for ${fitFile.fileName}:`, err);
        failed++;
      }

      setState((prev) => ({ ...prev, processed: prev.processed + 1 }));
    }

    if (updates.length > 0) {
      useSessionsStore.getState().replaceSessions(updates);
      useCoachPlanStore.getState().clearPlan();
      useFiltersStore.getState().recomputePBs();
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
  }, []);

  return {
    reimporting: state.reimporting,
    processed: state.processed,
    total: state.total,
    reimportAll,
  };
};
