import { getLocale } from '@/paraglide/runtime.js';
import type { ChartHoverX } from '@/store/chartHover.ts';

const dayFmt = new Intl.DateTimeFormat(getLocale(), {
  month: 'numeric',
  day: 'numeric',
  year: 'numeric',
});
const monthFmt = new Intl.DateTimeFormat(getLocale(), { month: 'numeric', year: 'numeric' });

export const formatDashboardDate = (x: ChartHoverX): string => {
  const value = String(x);
  if (value.length === 7) return monthFmt.format(new Date(`${value}-01T00:00:00`));
  return dayFmt.format(new Date(`${value}T00:00:00`));
};
