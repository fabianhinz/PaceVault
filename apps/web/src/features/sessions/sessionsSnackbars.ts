import { m } from '@pacevault/i18n/messages.js';
import type { SnackbarMap } from '@/lib/snackbar.ts';

export const SESSIONS_SNACKBARS = {
  dropHint: {
    key: 'SESSIONS_SNACKBARS_dropHint',
    message: m.toast_drop_hint,
    variant: 'default',
    persistent: true,
  },
  saveFailed: {
    key: 'SESSIONS_SNACKBARS_saveFailed',
    message: m.toast_save_failed_title,
    description: m.toast_save_failed_desc,
    variant: 'error',
  },
  exportNoGps: {
    key: 'SESSIONS_SNACKBARS_exportNoGps',
    message: m.toast_export_no_gps,
    variant: 'error',
  },
  editInStudioFailed: {
    key: 'SESSIONS_SNACKBARS_editInStudioFailed',
    message: m.toast_edit_in_studio_failed,
    variant: 'error',
  },
} satisfies SnackbarMap;
