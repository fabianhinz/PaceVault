import { useCallback } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useUserStore } from '@/store/user.ts';
import { useImportProgressStore, type ImportSummary } from '@/store/importProgress.ts';
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
import type { UserProfile } from '@/types/index.ts';

const importFiles = async (
  fileArray: File[],
  profile: UserProfile,
  queryClient: QueryClient,
): Promise<ImportSummary> => {
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
    return { kind: 'imported', imported: 0, duplicated: 0, failed };
  }

  useImportProgressStore.getState().setImportTotal(fitCount);

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
    useImportProgressStore.getState().advanceImport();
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

  useImportProgressStore.getState().markImportSaving();
  const outcome = await batcher.finish();
  if (outcome.saveFailed) {
    toast(m.toast_save_failed_title(), m.toast_save_failed_desc(), 'error');
  }

  return {
    kind: 'imported',
    imported: outcome.importedCount,
    duplicated: outcome.duplicateCount,
    failed,
  };
};

export const useFileUpload = () => {
  const profile = useUserStore((s) => s.profile);
  const uploading = useImportProgressStore((s) => s.foreground !== null);
  const queryClient = useQueryClient();

  const handleFiles = useCallback(
    async (files: FileList) => {
      if (!profile) return;

      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      useImportProgressStore.getState().beginImport({ foreground: true });

      try {
        const summary = await importFiles(fileArray, profile, queryClient);
        useImportProgressStore.getState().finishImport(summary);
      } catch (error) {
        console.error('Import error: ', error);
        useImportProgressStore
          .getState()
          .finishImport({ kind: 'failed', message: m.ui_import_failed_generic() });
      }
    },
    [profile, queryClient],
  );

  return { uploading, profile, handleFiles };
};
