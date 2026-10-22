export interface DatedValue<T> {
  date: number;
  value: T;
}

export const valueAt = <T>(history: DatedValue<T>[], date: number): T | undefined => {
  let latest: DatedValue<T> | undefined = undefined;
  let earliest: DatedValue<T> | undefined = undefined;
  for (const entry of history) {
    if (earliest === undefined || entry.date < earliest.date) earliest = entry;
    if (entry.date > date) continue;
    if (latest === undefined || entry.date >= latest.date) latest = entry;
  }
  if (latest !== undefined) return latest.value;
  return earliest?.value;
};

export const upsertDatedValue = <T>(
  history: DatedValue<T>[],
  entry: DatedValue<T>,
): DatedValue<T>[] =>
  [...history.filter((existing) => existing.date !== entry.date), entry].sort(
    (a, b) => a.date - b.date,
  );
