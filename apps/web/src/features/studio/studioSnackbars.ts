import { m } from '@pacevault/i18n/messages.js';
import type { SnackbarMap } from '@/lib/snackbar.ts';

export const STUDIO_SNACKBARS = {
  gpxImportSucceeded: {
    key: 'STUDIO_SNACKBARS_gpxImportSucceeded',
    message: m.toast_gpx_import_success_other,
    variant: 'success',
  },
  gpxImportFailed: {
    key: 'STUDIO_SNACKBARS_gpxImportFailed',
    message: m.toast_gpx_import_failed_other,
    variant: 'error',
  },
} satisfies SnackbarMap;
