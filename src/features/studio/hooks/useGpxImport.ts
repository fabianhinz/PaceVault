import { useState } from 'react';
import { m } from '@/paraglide/messages.js';
import { toast } from '@/components/ui/toastStore.ts';
import { createStudioRouteFromGpx } from '../createStudioRoute.ts';

const importFile = async (file: File): Promise<boolean> => {
  let text: string;
  try {
    text = await file.text();
  } catch {
    return false;
  }

  const id = await createStudioRouteFromGpx(text, {
    fallbackName: file.name.replace(/\.gpx$/i, ''),
    sourceFileName: file.name,
  });
  return id !== null;
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
