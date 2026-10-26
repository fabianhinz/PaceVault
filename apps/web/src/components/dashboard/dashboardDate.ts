import { formatDate } from '@/lib/format/formatters.ts';
import type { ChartHoverX } from '@/store/chartHover.ts';

export const formatDashboardDate = (x: ChartHoverX): string => {
  const value = String(x);
  if (value.length === 7) return formatDate(new Date(`${value}-01T00:00:00`), 'numeric-month');
  return formatDate(new Date(`${value}T00:00:00`), 'numeric-day');
};
