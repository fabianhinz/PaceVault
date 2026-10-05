export interface SeriesSummary {
  avg: number | undefined;
  min: number | undefined;
  max: number | undefined;
  total: number;
}

export const summarizeValues = (
  values: ReadonlyArray<number | null | undefined>,
): SeriesSummary => {
  let total = 0;
  let count = 0;
  let min: number | undefined = undefined;
  let max: number | undefined = undefined;
  for (const v of values) {
    if (v === undefined || v === null) continue;
    total += v;
    count += 1;
    if (min === undefined || v < min) min = v;
    if (max === undefined || v > max) max = v;
  }
  let avg: number | undefined = undefined;
  if (count > 0) {
    avg = total / count;
  }
  return { avg, min, max, total };
};
