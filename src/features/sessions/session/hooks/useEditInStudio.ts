import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { m } from '@/paraglide/messages.js';
import { toast } from '@/components/ui/toastStore.ts';
import { getSessionRecords } from '@/lib/indexeddb.ts';
import { buildSessionGpx } from '@/lib/gpxExport.ts';
import { buildGpxFilename } from '@/packages/gpx/buildGpx.ts';
import { formatDate } from '@/lib/formatters.ts';
import { createStudioRouteFromGpx } from '@/features/studio/createStudioRoute.ts';
import type { TrainingSession } from '@/packages/engine/types.ts';

/**
 * Imports a session's track into the studio as a new route and opens it, so
 * users can edit the GPX directly instead of exporting and re-importing.
 */
export const useEditInStudio = (session: TrainingSession) => {
  const navigate = useNavigate();
  const [preparing, setPreparing] = useState(false);

  const editInStudio = async () => {
    setPreparing(true);
    try {
      const records = await getSessionRecords(session.id);
      const gpx = buildSessionGpx(session, records);
      if (gpx === null) {
        toast(m.toast_export_no_gps(), undefined, 'error');
        return;
      }

      const id = await createStudioRouteFromGpx(gpx, {
        fallbackName: session.name ?? formatDate(session.date),
        sourceFileName: buildGpxFilename(session.sport, session.date),
      });
      if (id === null) {
        toast(m.toast_edit_in_studio_failed(), undefined, 'error');
        return;
      }

      navigate(`/studio/${id}`);
    } catch {
      toast(m.toast_edit_in_studio_failed(), undefined, 'error');
    } finally {
      setPreparing(false);
    }
  };

  return {
    canEdit: session.hasDetailedRecords,
    preparing,
    editInStudio,
  };
};
