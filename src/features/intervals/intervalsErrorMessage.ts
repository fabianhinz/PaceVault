import { m } from '@/paraglide/messages.js';
import type { IntervalsErrorCode } from '@/lib/intervals/client.ts';

export const intervalsErrorMessage = (code: IntervalsErrorCode): string => {
  if (code === 'unauthorized') return m.ui_intervals_error_key();
  if (code === 'offline') return m.ui_intervals_error_offline();
  if (code === 'network') return m.ui_intervals_error_network();
  return m.ui_intervals_error_generic();
};
