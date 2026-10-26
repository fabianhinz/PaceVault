import { useState } from 'react';
import { useSnackbar } from '@/lib/hooks/useSnackbar.ts';
import { COMMON_SNACKBARS } from '@/commonSnackbars.ts';
import { SESSIONS_SNACKBARS } from '@/components/sessions/sessionsSnackbars.ts';
import { getSessionRecords } from '@/lib/storage/db.ts';
import { buildGpxFilename, buildSessionGpx } from '@/components/sessions/gpxExport.ts';
import type { TrainingSession } from '@pacevault/engine/types.ts';
import { downloadFile } from '@/components/sessions/downloadFile.ts';

interface SessionExport {
  exporting: boolean;
  exportable: boolean;
  exportGpx: () => Promise<void>;
}

export const useSessionExport = (session: TrainingSession): SessionExport => {
  const [exporting, setExporting] = useState(false);
  const snackbar = useSnackbar();

  const exportGpx = async () => {
    setExporting(true);
    try {
      const records = await getSessionRecords(session.id);
      const gpxString = buildSessionGpx({ session, records });

      if (gpxString === null) {
        snackbar.enqueueSnackbar(SESSIONS_SNACKBARS.exportNoGps);
        return;
      }

      const filename = buildGpxFilename({ sport: session.sport, dateMs: session.date });
      const file = new File([gpxString], filename, { type: 'application/gpx+xml' });

      downloadFile(file);
    } catch {
      snackbar.enqueueSnackbar(COMMON_SNACKBARS.exportFailed);
    } finally {
      setExporting(false);
    }
  };

  return {
    exporting,
    exportable: session.hasDetailedRecords,
    exportGpx,
  };
};
