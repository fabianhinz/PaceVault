import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { m } from '@pacevault/i18n/messages.js';
import { useIntervalsStore } from '@/store/intervals.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useImportProgressStore } from '@/store/importProgress.ts';
import { intervalsErrorCode } from '@/lib/api/intervals.ts';
import { MESSAGE_BY_INTERVALS_ERROR } from '@/microcopy/intervals.ts';
import {
  checkIntervalsKey,
  intervalsKeyCheckQueryKey,
} from '@/queries/intervals/useIntervalsKeyCheck.ts';
import { useConnectIntervalsMutation } from '@/mutations/intervals/useConnectIntervalsMutation.ts';
import type { ProfileGate } from '@/components/settings/hooks/types.ts';

interface IntervalsImport {
  error: string | null;
  manual: boolean;
  clearError: () => void;
  handleImport: () => Promise<void>;
}

export const useIntervalsImport = ({
  keyInput,
  onSynced,
  profileGate,
}: {
  keyInput: string;
  onSynced: (() => void) | undefined;
  profileGate: ProfileGate | undefined;
}): IntervalsImport => {
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const queryClient = useQueryClient();
  const connect = useConnectIntervalsMutation();

  const handleImport = async () => {
    const trimmed = keyInput.trim();
    if (trimmed.length === 0) return;

    profileGate?.save();

    setManual(true);
    setError(null);

    try {
      await queryClient.fetchQuery({
        queryKey: intervalsKeyCheckQueryKey({ apiKey: trimmed }),
        queryFn: () => checkIntervalsKey({ apiKey: trimmed }),
        staleTime: Infinity,
        retry: false,
      });
    } catch (err) {
      if (err instanceof Error) setError(MESSAGE_BY_INTERVALS_ERROR[intervalsErrorCode(err)]());
      setManual(false);
      return;
    }

    // Started before the store writes: the mutation runs its full sync one microtask later, ahead of
    // the re-render that enables the background `useIntervalsSync`, which would otherwise win the race.
    const connecting = connect.mutateAsync({ apiKey: trimmed });
    useImportProgressStore.getState().beginImport({ foreground: true });
    useIntervalsStore.getState().connectIntervals(trimmed);

    try {
      const summary = await connecting;
      if (summary.available === 0) {
        useImportProgressStore.getState().finishImport({ kind: 'no-activities' });
      } else if (summary.pending === 0) {
        useImportProgressStore.getState().finishImport({ kind: 'nothing-new' });
      } else {
        useImportProgressStore.getState().finishImport({
          kind: 'imported',
          imported: summary.imported,
          duplicated: summary.duplicated,
          failed: summary.failed,
        });
      }

      if (useSessionsStore.getState().sessions.length > 0) onSynced?.();
    } catch (err) {
      let message: string = m.ui_intervals_error_generic();
      if (err instanceof Error) message = MESSAGE_BY_INTERVALS_ERROR[intervalsErrorCode(err)]();
      useImportProgressStore.getState().finishImport({ kind: 'failed', message });
    }

    setManual(false);
  };

  const clearError = () => setError(null);

  return { error, manual, clearError, handleImport };
};
