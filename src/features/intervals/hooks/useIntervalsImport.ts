import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useIntervalsStore } from '@/store/intervals.ts';
import { useUserStore } from '@/store/user.ts';
import { useUploadProgressStore } from '@/store/uploadProgress.ts';
import { toast } from '@/components/ui/toastStore.ts';
import { m } from '@/paraglide/messages.js';
import {
  buildRangeWindow,
  buildSyncWindow,
  type ImportRange,
} from '@/lib/intervals/intervalsDates.ts';
import { buildImportSummary } from '@/features/sessions/importSummary.ts';
import { runIntervalsImport, type IntervalsImportResult } from '../runIntervalsImport.ts';
import { intervalsErrorMessage } from '../intervalsErrorMessage.ts';
import { intervalsKeys } from '../intervalsKeys.ts';

export const useIntervalsImport = () => {
  const uploading = useUploadProgressStore((s) => s.uploading);
  const controllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const run = useCallback(
    async (mode: ImportRange | 'sync'): Promise<IntervalsImportResult | undefined> => {
      const apiKey = useIntervalsStore.getState().apiKey;
      const profile = useUserStore.getState().profile;

      if (apiKey === null) return undefined;
      if (!profile) {
        toast(m.toast_intervals_no_profile(), undefined, 'error');
        return undefined;
      }
      if (useUploadProgressStore.getState().uploading) return undefined;

      const now = Date.now();
      let window = buildSyncWindow(useIntervalsStore.getState().lastSyncedAt, now);
      if (mode !== 'sync') {
        window = buildRangeWindow(mode, now);
      }

      const controller = new AbortController();
      controllerRef.current = controller;
      useUploadProgressStore.getState().beginProcessing();

      let started = false;
      const result = await runIntervalsImport({
        apiKey,
        profile,
        window,
        knownActivityIds: useIntervalsStore.getState().importedActivityIds,
        signal: controller.signal,
        onProgress: (_processed, total) => {
          if (!started) {
            started = true;
            useUploadProgressStore.getState().startUpload(total, 'intervals');
            return;
          }
          useUploadProgressStore.getState().advance();
        },
      });

      controllerRef.current = null;

      if (result.fatal !== undefined) {
        useUploadProgressStore.getState().finish(intervalsErrorMessage(result.fatal), 'error');
        return result;
      }

      useIntervalsStore.getState().recordIntervalsSync(Date.now(), result.importedActivityIds);
      await queryClient.invalidateQueries({ queryKey: intervalsKeys.all });

      const summary = buildImportSummary({
        imported: result.imported,
        duplicated: result.duplicated,
        failed: result.failed,
        unsupported: result.unsupported + result.unavailable,
      });

      if (summary.message.length > 0) {
        useUploadProgressStore.getState().finish(summary.message, summary.variant);
      } else {
        useUploadProgressStore.getState().finish(m.toast_intervals_nothing_new(), 'success');
      }

      return result;
    },
    [queryClient],
  );

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  return { uploading, run, cancel };
};
