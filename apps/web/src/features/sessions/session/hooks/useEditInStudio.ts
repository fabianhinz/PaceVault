import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePageRouting } from '@/routing/usePageRouting.ts';
import { useSnackbar } from '@/lib/hooks/useSnackbar.ts';
import { SESSIONS_SNACKBARS } from '@/features/sessions/sessionsSnackbars.ts';
import { getSessionRecords } from '@/lib/db.ts';
import { buildGpxFilename, buildSessionGpx } from '@/lib/gpxExport.ts';
import { formatDate } from '@/lib/formatters.ts';
import { createStudioRouteFromGpx } from '@/features/studio/createStudioRoute.ts';
import type { TrainingSession } from '@pacevault/engine/types.ts';

interface EditInStudio {
  editable: boolean;
  preparing: boolean;
  editInStudio: () => Promise<void>;
}

export const useEditInStudio = (session: TrainingSession): EditInStudio => {
  const pageRouting = usePageRouting();
  const [preparing, setPreparing] = useState(false);
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  const editInStudio = async () => {
    setPreparing(true);
    try {
      const records = await getSessionRecords(session.id);
      const gpx = buildSessionGpx({ session, records });
      if (gpx === null) {
        snackbar.enqueueSnackbar(SESSIONS_SNACKBARS.exportNoGps);
        return;
      }

      const id = await createStudioRouteFromGpx(
        {
          text: gpx,
          fallbackName: session.name ?? formatDate(session.date),
          sourceFileName: buildGpxFilename({ sport: session.sport, dateMs: session.date }),
        },
        queryClient,
      );
      if (id === null) {
        snackbar.enqueueSnackbar(SESSIONS_SNACKBARS.editInStudioFailed);
        return;
      }

      pageRouting.open({ page: 'studioDetail', params: { routeId: id } });
    } catch {
      snackbar.enqueueSnackbar(SESSIONS_SNACKBARS.editInStudioFailed);
    } finally {
      setPreparing(false);
    }
  };

  return {
    editable: session.hasDetailedRecords,
    preparing,
    editInStudio,
  };
};
