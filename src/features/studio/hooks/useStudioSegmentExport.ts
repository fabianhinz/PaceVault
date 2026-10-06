import { useState } from 'react';
import { m } from '@/paraglide/messages.js';
import { toast } from '@/components/ui/toastStore.ts';
import { getStudioRoutePoints } from '@/lib/indexeddb.ts';
import { buildRouteSegmentGpx } from '@/lib/gpxExport.ts';
import { downloadFile } from '@/lib/downloadFile.ts';
import type { StudioRoute } from '@/store/studio.ts';

export const useStudioSegmentExport = () => {
  const [exporting, setExporting] = useState(false);

  const exportSegment = async (route: StudioRoute, startM: number, endM: number, index: number) => {
    setExporting(true);
    try {
      const points = await getStudioRoutePoints(route.id);
      const name = `${route.name} - segment ${index}`;
      const gpx = buildRouteSegmentGpx(points, startM, endM, {
        name,
        time: new Date(route.importedAt),
      });

      if (gpx === null) return;

      const file = new File([gpx], `${name}.gpx`, { type: 'application/gpx+xml' });
      downloadFile(file);
    } catch {
      toast(m.toast_export_failed(), undefined, 'error');
    } finally {
      setExporting(false);
    }
  };

  return { exporting, exportSegment };
};
