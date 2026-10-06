export const TRACK_SMOOTHING_SEC = {
  hr: 5,
  power: 30,
  pace: 10,
  wind: 10,
} as const;

export const rollingMean = (
  times: number[],
  values: Array<number | undefined>,
  windowSec: number,
): Array<number | undefined> => {
  const half = windowSec / 2;
  const result: Array<number | undefined> = [];
  let start = 0;
  let end = 0;
  let sum = 0;
  let count = 0;
  times.forEach((time, i) => {
    while (end < times.length && (times[end] ?? Infinity) <= time + half) {
      const value = values[end];
      if (value !== undefined) {
        sum += value;
        count += 1;
      }
      end += 1;
    }
    while (start < end && (times[start] ?? -Infinity) < time - half) {
      const value = values[start];
      if (value !== undefined) {
        sum -= value;
        count -= 1;
      }
      start += 1;
    }
    if (values[i] === undefined || count === 0) {
      result.push(undefined);
      return;
    }
    result.push(sum / count);
  });
  return result;
};
