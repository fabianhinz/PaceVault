import { useState } from 'react';
import { m } from '@/paraglide/messages.js';
import { parseGpx } from '@/packages/gpx/parseGpx.ts';
import { buildRouteGeometry } from '@/packages/gpx/routeGeometry.ts';
import { saveStudioRoutePoints, deleteStudioRoutePoints } from '@/lib/indexeddb.ts';
import { useStudioStore } from '@/store/studio.ts';
import { toast } from '@/components/ui/toastStore.ts';
import { DEFAULT_ROUTE_COLOR } from '../routeColors.ts';

const importFile = async (file: File): Promise<boolean> => {
  let text: string;
  try {
    text = await file.text();
  } catch {
    return false;
  }

  const parsed = parseGpx(text);
  if (!parsed) return false;
  const geometry = buildRouteGeometry(parsed.points);
  if (!geometry) return false;

  let name = parsed.name;
  if (!name) {
    name = file.name.replace(/\.gpx$/i, '');
  }

  const id = useStudioStore.getState().importStudioRoute({
    name,
    sourceFileName: file.name,
    color: DEFAULT_ROUTE_COLOR,
    encodedPolylines: geometry.encodedPolylines,
    bounds: geometry.bounds,
    distance: geometry.distance,
    elevation: geometry.elevation,
  });

  try {
    await saveStudioRoutePoints(id, geometry.points);
  } catch {
    useStudioStore.getState().deleteStudioRoute(id);
    await deleteStudioRoutePoints(id).catch(() => undefined);
    return false;
  }
  return true;
};

export const useGpxImport = () => {
  const [importing, setImporting] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setImporting(true);

    let imported = 0;
    let failed = 0;
    for (const file of fileArray) {
      const ok = await importFile(file);
      if (ok) {
        imported++;
      } else {
        failed++;
      }
    }

    setImporting(false);
    if (imported === 1) {
      toast(m.toast_gpx_import_success({ count: String(imported) }), undefined, 'success');
    } else if (imported > 1) {
      toast(m.toast_gpx_import_success_plural({ count: String(imported) }), undefined, 'success');
    }
    if (failed === 1) {
      toast(m.toast_gpx_import_failed({ count: String(failed) }), undefined, 'error');
    } else if (failed > 1) {
      toast(m.toast_gpx_import_failed_plural({ count: String(failed) }), undefined, 'error');
    }
  };

  return { importing, handleFiles };
};
