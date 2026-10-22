import { useState } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { toast } from '@/store/toast.ts';
import { getStudioRoutePoints } from '@/lib/indexeddb.ts';
import { buildRouteGpx, buildRouteSegmentGpx } from '@/lib/gpxExport.ts';
import { downloadFile } from '@/lib/downloadFile.ts';
import type { RoutePoint } from '@pacevault/gpx/routeGeometry.ts';
import type { StudioRoute } from '@/store/studio.ts';

export const useStudioRouteExport = () => {
  const [exporting, setExporting] = useState(false);

  const runExport = async (
    route: StudioRoute,
    name: string,
    build: (points: RoutePoint[], metadata: { name: string; time: Date }) => string | null,
  ) => {
    setExporting(true);
    try {
      const points = await getStudioRoutePoints(route.id);
      const gpx = build(points, { name, time: new Date(route.importedAt) });

      if (gpx === null) return;

      const file = new File([gpx], `${name}.gpx`, { type: 'application/gpx+xml' });
      downloadFile(file);
    } catch {
      toast(m.toast_export_failed(), undefined, 'error');
    } finally {
      setExporting(false);
    }
  };

  const exportRoute = (route: StudioRoute) =>
    runExport(route, route.name, (points, metadata) =>
      buildRouteGpx(points, route.markers, metadata),
    );

  const exportSegment = (route: StudioRoute, startM: number, endM: number, index: number) =>
    runExport(route, `${route.name} - segment ${index}`, (points, metadata) =>
      buildRouteSegmentGpx(points, route.markers, startM, endM, metadata),
    );

  return { exporting, exportRoute, exportSegment };
};
