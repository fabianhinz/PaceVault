import { m } from '@/paraglide/messages.js';

interface ImportCounts {
  imported: number;
  duplicated: number;
  failed: number;
  unsupported?: number;
}

interface ImportSummary {
  message: string;
  variant: 'success' | 'error' | 'warning';
}

export const buildImportSummary = (counts: ImportCounts): ImportSummary => {
  const parts: string[] = [];

  if (counts.imported > 0) {
    if (counts.imported === 1) {
      parts.push(m.toast_upload_sessions({ count: counts.imported }));
    } else {
      parts.push(m.toast_upload_sessions_plural({ count: counts.imported }));
    }
  }

  if (counts.duplicated > 0) {
    if (counts.duplicated === 1) {
      parts.push(m.toast_upload_duplicates({ count: counts.duplicated }));
    } else {
      parts.push(m.toast_upload_duplicates_plural({ count: counts.duplicated }));
    }
  }

  const unsupported = counts.unsupported ?? 0;
  if (unsupported > 0) {
    if (unsupported === 1) {
      parts.push(m.toast_upload_unsupported({ count: unsupported }));
    } else {
      parts.push(m.toast_upload_unsupported_plural({ count: unsupported }));
    }
  }

  if (counts.failed > 0) {
    parts.push(m.toast_upload_failed({ count: counts.failed }));
  }

  let variant: ImportSummary['variant'] = 'success';
  if (counts.failed > 0) {
    variant = 'error';
  } else if (counts.imported === 0) {
    variant = 'warning';
  }

  return { message: parts.join(', '), variant };
};
