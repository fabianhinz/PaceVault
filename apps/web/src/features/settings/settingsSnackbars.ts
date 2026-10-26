import { m } from '@pacevault/i18n/messages.js';
import type { SnackbarMap } from '@/lib/snackbar.ts';

export const SETTINGS_SNACKBARS = {
  allDataDeleted: {
    key: 'SETTINGS_SNACKBARS_allDataDeleted',
    message: m.ui_delete_dialog_toast,
    variant: 'success',
  },
} satisfies SnackbarMap;
