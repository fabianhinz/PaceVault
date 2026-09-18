import { useCallback } from 'react';
import { useUserStore } from '@/store/user.ts';
import { useUploadProgressStore } from '@/store/uploadProgress.ts';
import { parseFitFile, type ParsedFitResultWithMeta } from '@/parsers/fit.ts';
import { toast } from '@/components/ui/toastStore.ts';
import { m } from '@/paraglide/messages.js';
import { isArchiveFile, extractActivityFiles } from '@/lib/archive.ts';
import { toFitParseProfile } from '@/lib/fitParseProfile.ts';
import { ingestParsedFits } from '@/features/sessions/ingestParsedFits.ts';
import { buildImportSummary } from '@/features/sessions/importSummary.ts';

export const useFileUpload = (inputRef: React.RefObject<HTMLInputElement | null>) => {
  const profile = useUserStore((s) => s.profile);
  const uploading = useUploadProgressStore((s) => s.uploading);

  const triggerUpload = useCallback(() => {
    inputRef.current?.click();
  }, [inputRef]);

  const handleFiles = useCallback(
    async (files: FileList) => {
      if (!profile) return;

      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      useUploadProgressStore.getState().beginProcessing();

      const fitEntries: Array<{ name: string; data: ArrayBuffer }> = [];
      let failed = 0;

      for (const file of fileArray) {
        const lower = file.name.toLowerCase();
        if (lower.endsWith('.fit')) {
          fitEntries.push({ name: file.name, data: await file.arrayBuffer() });
        } else if (isArchiveFile(file.name)) {
          try {
            const raw = await file.arrayBuffer();
            const extracted = await extractActivityFiles(raw);
            const fitOnly = extracted.filter((e) => e.extension === '.fit');
            // TODO: handle .tcx files once a TCX parser is added
            if (fitOnly.length === 0) {
              failed++;
            } else {
              for (const entry of fitOnly) {
                fitEntries.push({ name: entry.fileName, data: entry.data });
              }
            }
          } catch {
            failed++;
          }
        } else {
          failed++;
        }
      }

      if (fitEntries.length === 0) {
        useUploadProgressStore.getState().cancel();
        if (failed > 0) {
          toast(m.toast_files_failed_title({ count: failed }), undefined, 'error');
        }
        return;
      }

      useUploadProgressStore.getState().startUpload(fitEntries.length);

      const parsingTasks: Promise<ParsedFitResultWithMeta | null>[] = [];
      for (const entry of fitEntries) {
        parsingTasks.push(
          parseFitFile(entry.data, entry.name, toFitParseProfile(profile))
            .then((result) => {
              return { ...result, rawData: entry.data, fileName: entry.name };
            })
            .catch((error) => {
              console.error('Parse error: ', error);
              failed++;
              return null;
            })
            .finally(() => {
              useUploadProgressStore.getState().advance();
            }),
        );
      }

      const parsed: ParsedFitResultWithMeta[] = [];
      for (const task of await Promise.allSettled(parsingTasks)) {
        if (task.status === 'fulfilled' && task.value) {
          parsed.push(task.value);
        }
      }

      const outcome = await ingestParsedFits(parsed);
      if (outcome.saveFailed) {
        toast(m.toast_save_failed_title(), m.toast_save_failed_desc(), 'error');
      }

      const summary = buildImportSummary({
        imported: outcome.importedCount,
        duplicated: outcome.duplicateCount,
        failed,
      });

      if (summary.message.length > 0) {
        useUploadProgressStore.getState().finish(summary.message, summary.variant);
      }

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [profile, inputRef],
  );

  return { uploading, profile, triggerUpload, handleFiles };
};
