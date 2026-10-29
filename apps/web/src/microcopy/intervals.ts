import { m } from '@pacevault/i18n/messages.js';
import type { IntervalsErrorCode } from '@/lib/api/intervals.ts';

export const MESSAGE_BY_INTERVALS_ERROR: Record<IntervalsErrorCode, () => string> = {
  unauthorized: m.ui_intervals_error_key,
  'rate-limited': m.ui_intervals_error_rate_limited,
  network: m.ui_intervals_error_network,
  failed: m.ui_intervals_error_generic,
};
