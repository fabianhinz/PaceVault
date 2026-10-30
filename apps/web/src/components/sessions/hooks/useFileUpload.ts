import { useCallback } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useUserStore } from '@/store/user.ts';
import { useImportProgressStore, type ImportSummary } from '@/store/importProgress.ts';
import { parseFitFile } from '@/parsers/fit.ts';
import { useSnackbar, type Snackbar } from '@/lib/hooks/useSnackbar.ts';
import { SESSIONS_SNACKBARS } from '@/components/sessions/sessionsSnackbars.ts';
import { m } from '@pacevault/i18n/messages.js';
import {
  collectUploadSources,
  extractArchiveEntry,
  type UploadSource,
} from '@/components/sessions/archive.ts';
import { toFitParseProfile } from '@/parsers/fitParseProfile.ts';
import { createIngestBatcher } from '@/lib/storage/createIngestBatcher.ts';
import type { UserProfile } from '@/types.ts';

type IngestFit = (target: { fileName: string; read: () => Promise<ArrayBuffer> }) => Promise<void>;

const ingestSources = async ({
  sources,
  ingestFit,
}: {
  sources: UploadSource[];
  ingestFit: IngestFit;
}): Promise<void> => {
  for (const source of sources) {
    if (source.archiveEntries === undefined) {
      await ingestFit({ fileName: source.file.name, read: () => source.file.arrayBuffer() });
      continue;
    }
    const archive = await source.file.arrayBuffer();
    for (const entry of source.archiveEntries) {
      await ingestFit({
        fileName: entry.fileName,
        read: async () => extractArchiveEntry({ archive, path: entry.path }),
      });
    }
  }
};

const importFiles = async (
  { files, profile }: { files: File[]; profile: UserProfile },
  queryClient: QueryClient,
  snackbar: Snackbar,
): Promise<ImportSummary> => {
  const collected = await collectUploadSources(files);
  if (collected.fitCount === 0) {
    return { kind: 'imported', imported: 0, duplicated: 0, failed: collected.failed };
  }

  useImportProgressStore.getState().setImportTotal(collected.fitCount);

  const batcher = createIngestBatcher({ queryClient });
  let failed = collected.failed;

  const ingestFit: IngestFit = async ({ fileName, read }) => {
    try {
      const data = await read();
      const result = await parseFitFile({
        arrayBuffer: data,
        fileName,
        profileAt: toFitParseProfile(profile),
      });
      await batcher.add({ ...result, rawData: data, fileName, source: { kind: 'file' } });
    } catch (error) {
      console.error('Parse error: ', error);
      failed++;
    }
    useImportProgressStore.getState().advanceImport();
  };

  await ingestSources({ sources: collected.sources, ingestFit });

  useImportProgressStore.getState().markImportSaving();
  const outcome = await batcher.finish();
  if (outcome.saveFailed) {
    snackbar.enqueueSnackbar(SESSIONS_SNACKBARS.saveFailed);
  }

  return {
    kind: 'imported',
    imported: outcome.importedCount,
    duplicated: outcome.duplicateCount,
    failed,
  };
};

interface FileUpload {
  uploading: boolean;
  profile: UserProfile | null;
  handleFiles: (files: FileList) => Promise<void>;
}

export const useFileUpload = (): FileUpload => {
  const profile = useUserStore((s) => s.profile);
  const uploading = useImportProgressStore((s) => s.foreground !== null);
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  const handleFiles = useCallback(
    async (files: FileList) => {
      const profile = useUserStore.getState().profile;
      if (!profile) return;

      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      useImportProgressStore.getState().beginImport('files');

      try {
        const summary = await importFiles({ files: fileArray, profile }, queryClient, snackbar);
        useImportProgressStore.getState().finishImport(summary);
      } catch (error) {
        console.error('Import error: ', error);
        useImportProgressStore
          .getState()
          .finishImport({ kind: 'failed', message: m.ui_import_failed_generic() });
      }
    },
    [queryClient, snackbar],
  );

  return { uploading, profile, handleFiles };
};
