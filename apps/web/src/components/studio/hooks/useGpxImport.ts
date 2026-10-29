import { useState } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { m } from '@pacevault/i18n/messages.js';
import { formatPlural } from '@/lib/format/formatters.ts';
import { useSnackbar } from '@/lib/hooks/useSnackbar.ts';
import { STUDIO_SNACKBARS } from '@/components/studio/studioSnackbars.ts';
import { createStudioRouteFromGpx } from '@/components/studio/createStudioRoute.ts';

const importFile = async (file: File, queryClient: QueryClient): Promise<boolean> => {
  let text: string;
  try {
    text = await file.text();
  } catch {
    return false;
  }

  const id = await createStudioRouteFromGpx(
    { text, fallbackName: file.name.replace(/\.gpx$/i, ''), sourceFileName: file.name },
    queryClient,
  );
  return id !== null;
};

interface GpxImport {
  importing: boolean;
  handleFiles: (files: FileList | null) => Promise<void>;
}

export const useGpxImport = (): GpxImport => {
  const [importing, setImporting] = useState(false);
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setImporting(true);

    let imported = 0;
    let failed = 0;
    for (const file of fileArray) {
      const ok = await importFile(file, queryClient);
      if (ok) {
        imported++;
      } else {
        failed++;
      }
    }

    setImporting(false);
    if (imported > 0) {
      snackbar.enqueueSnackbar({
        ...STUDIO_SNACKBARS.gpxImportSucceeded,
        message: () =>
          formatPlural(imported, {
            one: () => m.toast_gpx_import_success_one({ count: String(imported) }),
            other: () => STUDIO_SNACKBARS.gpxImportSucceeded.message({ count: String(imported) }),
          }),
      });
    }
    if (failed > 0) {
      snackbar.enqueueSnackbar({
        ...STUDIO_SNACKBARS.gpxImportFailed,
        message: () =>
          formatPlural(failed, {
            one: () => m.toast_gpx_import_failed_one({ count: String(failed) }),
            other: () => STUDIO_SNACKBARS.gpxImportFailed.message({ count: String(failed) }),
          }),
      });
    }
  };

  return { importing, handleFiles };
};
