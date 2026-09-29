import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '@/store/user.ts';
import { useUploadProgressStore } from '@/store/uploadProgress.ts';
import { parseFitFile } from '@/parsers/fit.ts';
import { toast } from '@/components/ui/toastStore.ts';
import { m } from '@/paraglide/messages.js';
import {
  extractArchiveEntry,
  isArchiveFile,
  listActivityEntries,
  type ArchiveEntry,
} from '@/lib/archive.ts';
import { toFitParseProfile } from '@/lib/fitParseProfile.ts';
import { createIngestBatcher } from '@/features/sessions/createIngestBatcher.ts';

export const useFileUpload = () => {
  const profile = useUserStore((s) => s.profile);
  const uploading = useUploadProgressStore((s) => s.uploading);
  const queryClient = useQueryClient();

  const handleFiles = useCallback(
    async (files: FileList) => {
      if (!profile) return;

      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      useUploadProgressStore.getState().beginProcessing();

      const sources: Array<{ file: File; archiveEntries?: ArchiveEntry[] }> = [];
      let fitCount = 0;
      let failed = 0;

      for (const file of fileArray) {
        const lower = file.name.toLowerCase();
        if (lower.endsWith('.fit')) {
          sources.push({ file });
          fitCount++;
        } else if (isArchiveFile(file.name)) {
          try {
            const archiveEntries = listActivityEntries(await file.arrayBuffer()).filter(
              (e) => e.extension === '.fit',
            );
            // TODO: handle .tcx files once a TCX parser is added
            if (archiveEntries.length === 0) {
              failed++;
            } else {
              sources.push({ file, archiveEntries });
              fitCount += archiveEntries.length;
            }
          } catch {
            failed++;
          }
        } else {
          failed++;
        }
      }

      if (fitCount === 0) {
        useUploadProgressStore.getState().cancel();
        if (failed > 0) {
          toast(m.toast_files_failed_title({ count: failed }), undefined, 'error');
        }
        return;
      }

      useUploadProgressStore.getState().startUpload(fitCount);

      const batcher = createIngestBatcher({ queryClient });

      const ingestFit = async (fileName: string, read: () => Promise<ArrayBuffer>) => {
        try {
          const data = await read();
          const result = await parseFitFile(data, fileName, toFitParseProfile(profile));
          await batcher.add({ ...result, rawData: data, fileName, source: { kind: 'file' } });
        } catch (error) {
          console.error('Parse error: ', error);
          failed++;
        }
        useUploadProgressStore.getState().advance();
      };

      for (const source of sources) {
        if (source.archiveEntries === undefined) {
          await ingestFit(source.file.name, () => source.file.arrayBuffer());
          continue;
        }
        const archive = await source.file.arrayBuffer();
        for (const entry of source.archiveEntries) {
          await ingestFit(entry.fileName, async () => extractArchiveEntry(archive, entry.path));
        }
      }

      const outcome = await batcher.finish();
      if (outcome.saveFailed) {
        toast(m.toast_save_failed_title(), m.toast_save_failed_desc(), 'error');
      }

      const uploaded = outcome.importedCount;
      const duplicated = outcome.duplicateCount;
      const parts: string[] = [];

      if (uploaded > 0) {
        let uploadMsg = m.toast_upload_sessions_plural({ count: uploaded });
        if (uploaded === 1) {
          uploadMsg = m.toast_upload_sessions({ count: uploaded });
        }
        parts.push(uploadMsg);
      }

      if (duplicated > 0) {
        let dupMsg = m.toast_upload_duplicates_plural({ count: duplicated });
        if (duplicated === 1) {
          dupMsg = m.toast_upload_duplicates({ count: duplicated });
        }
        parts.push(dupMsg);
      }

      if (failed > 0) {
        parts.push(m.toast_upload_failed({ count: failed }));
      }

      if (parts.length > 0) {
        let variant: 'success' | 'error' | 'warning' = 'success';
        if (failed > 0) {
          variant = 'error';
        } else if (uploaded === 0) {
          variant = 'warning';
        }
        useUploadProgressStore.getState().finish(parts.join(', '), variant);
      }
    },
    [profile, queryClient],
  );

  return { uploading, profile, handleFiles };
};
