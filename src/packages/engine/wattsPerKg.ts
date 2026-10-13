import { valueAt, type DatedValue } from './datedValue.ts';

const earliestDate = (history: DatedValue<number>[]): number =>
  Math.min(...history.map((entry) => entry.date));

export const wattsPerKgHistory = (
  ftp: DatedValue<number>[],
  weight: DatedValue<number>[],
): DatedValue<number>[] => {
  if (ftp.length === 0 || weight.length === 0) return [];
  const start = Math.max(earliestDate(ftp), earliestDate(weight));
  const dates = [...new Set([...ftp, ...weight].map((entry) => entry.date))]
    .filter((date) => date >= start)
    .sort((a, b) => a - b);
  const history: DatedValue<number>[] = [];
  for (const date of dates) {
    const watts = valueAt(ftp, date);
    const kg = valueAt(weight, date);
    if (watts === undefined || kg === undefined) continue;
    history.push({ date, value: watts / kg });
  }
  return history;
};
