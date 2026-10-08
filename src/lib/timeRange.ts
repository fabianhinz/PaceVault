import type { FilterOption } from '@/components/layout/DockFilterOptions';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';

export type TimeRange = '7d' | '30d' | '90d' | 'all' | 'custom';

type FixedDayRange = Exclude<TimeRange, 'all' | 'custom'>;

export const rangeMap: Record<Exclude<TimeRange, 'custom'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  all: Infinity,
};

const fixedDayRanges: FixedDayRange[] = ['7d', '30d', '90d'];

const unitFormat = (unit: 'day' | 'month', unitDisplay: 'narrow' | 'long') =>
  new Intl.NumberFormat(getLocale(), { style: 'unit', unit, unitDisplay });

export const formatTimeRangeLabel = (range: TimeRange): string => {
  if (range === 'all') {
    return m.ui_range_all_time();
  }
  if (range === 'custom') {
    return m.ui_range_custom();
  }
  return unitFormat('day', 'long').format(rangeMap[range]);
};

export const rangeToCutoff = (
  range: Exclude<TimeRange, 'custom'>,
  now: number = Date.now(),
): number => {
  const days = rangeMap[range];
  if (days === Infinity) {
    return 0;
  }
  return now - days * 24 * 60 * 60 * 1000;
};

export const customRangeToCutoffs = (range: {
  from: string;
  to: string;
}): { from: number; to: number } => ({
  from: new Date(range.from).setHours(0, 0, 0, 0),
  to: new Date(range.to).setHours(23, 59, 59, 999),
});

export const formatCustomRangeDuration = (range: { from: string; to: string }): string => {
  const days =
    Math.round(
      (new Date(range.to).getTime() - new Date(range.from).getTime()) / (24 * 60 * 60 * 1000),
    ) + 1;
  if (days > 99) {
    const months = Math.round(days / 30);
    return unitFormat('month', 'narrow').formatRange(months, months);
  }
  return unitFormat('day', 'narrow').formatRange(days, days);
};

export const getTimeRangeOptions = (): FilterOption<TimeRange>[] => {
  const dayFormat = unitFormat('day', 'narrow');
  return [
    { value: 'all', label: m.ui_range_all_short() },
    ...fixedDayRanges.map((range) => ({ value: range, label: dayFormat.format(rangeMap[range]) })),
  ];
};
