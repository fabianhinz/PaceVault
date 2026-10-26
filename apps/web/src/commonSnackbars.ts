import { m } from '@pacevault/i18n/messages.js';
import type { SnackbarMap } from '@/lib/format/snackbar.ts';

export const COMMON_SNACKBARS = {
  exportFailed: {
    key: 'COMMON_SNACKBARS_exportFailed',
    message: m.toast_export_failed,
    variant: 'error',
  },
} satisfies SnackbarMap;
