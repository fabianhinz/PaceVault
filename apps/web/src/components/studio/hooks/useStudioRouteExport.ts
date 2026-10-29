import { useState } from 'react';
import { useSnackbar } from '@/lib/hooks/useSnackbar.ts';
import { COMMON_SNACKBARS } from '@/commonSnackbars.ts';
import { getStudioRoutePoints } from '@/lib/storage/db.ts';
import { buildRouteGpx, buildRouteSegmentGpx } from '@/components/sessions/gpxExport.ts';
import { downloadFile } from '@/components/sessions/downloadFile.ts';
import type { RoutePoint } from '@pacevault/gpx/types.ts';
import type { StudioRoute } from '@/types.ts';

export interface StudioRouteExport {
  exporting: boolean;
  exportRoute: (route: StudioRoute) => Promise<void>;
  exportSegment: ({
    route,
    startM,
    endM,
    index,
  }: {
    route: StudioRoute;
    startM: number;
    endM: number;
    index: number;
  }) => Promise<void>;
}

export const useStudioRouteExport = (): StudioRouteExport => {
  const [exporting, setExporting] = useState(false);
  const snackbar = useSnackbar();

  const runExport = async ({
    route,
    name,
    build,
  }: {
    route: StudioRoute;
    name: string;
    build: ({
      points,
      metadata,
    }: {
      points: RoutePoint[];
      metadata: { name: string; time: Date };
    }) => string | null;
  }) => {
    setExporting(true);
    try {
      const points = await getStudioRoutePoints(route.id);
      const gpx = build({ points, metadata: { name, time: new Date(route.importedAt) } });

      if (gpx === null) return;

      const file = new File([gpx], `${name}.gpx`, { type: 'application/gpx+xml' });
      downloadFile(file);
    } catch {
      snackbar.enqueueSnackbar(COMMON_SNACKBARS.exportFailed);
    } finally {
      setExporting(false);
    }
  };

  const exportRoute = (route: StudioRoute) =>
    runExport({
      route,
      name: route.name,
      build: ({ points, metadata }) => buildRouteGpx({ points, markers: route.markers, metadata }),
    });

  const exportSegment = ({
    route,
    startM,
    endM,
    index,
  }: {
    route: StudioRoute;
    startM: number;
    endM: number;
    index: number;
  }) =>
    runExport({
      route,
      name: `${route.name} - segment ${index}`,
      build: ({ points, metadata }) =>
        buildRouteSegmentGpx({ points, markers: route.markers, startM, endM, metadata }),
    });

  return { exporting, exportRoute, exportSegment };
};
