import { m } from '@pacevault/i18n/messages.js';
import type { SnackbarMap } from '@/lib/format/snackbar.ts';

export const SEGMENTS_SNACKBARS = {
  noGps: {
    key: 'SEGMENTS_SNACKBARS_noGps',
    message: m.toast_segment_no_gps,
    variant: 'error',
  },
} satisfies SnackbarMap;
