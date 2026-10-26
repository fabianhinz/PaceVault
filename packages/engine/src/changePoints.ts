// Sources: [Killick2012]
// See packages/engine/SOURCES.md for full citations.

const prefixSums = (values: number[]): { sums: Float64Array; squares: Float64Array } => {
  const sums = new Float64Array(values.length + 1);
  const squares = new Float64Array(values.length + 1);
  values.forEach((value, i) => {
    sums[i + 1] = (sums[i] ?? 0) + value;
    squares[i + 1] = (squares[i] ?? 0) + value * value;
  });
  return { sums, squares };
};

const changesFrom = ({ last, valueCount }: { last: Int32Array; valueCount: number }): number[] => {
  const changes: number[] = [];
  let end = valueCount;
  while (end > 0) {
    const start = last[end] ?? 0;
    if (start > 0) changes.push(start);
    end = start;
  }
  return changes.reverse();
};

/** Optimal partitioning with pruning, Gaussian mean-shift cost. @see [Killick2012] */
export const peltChangePoints = ({
  values,
  beta,
  minBins,
}: {
  values: number[];
  beta: number;
  minBins: number;
}): number[] => {
  const valueCount = values.length;
  if (valueCount < 2 * minBins) return [];
  const prefix = prefixSums(values);
  const sums = prefix.sums;
  const squares = prefix.squares;
  const cost = ({ start, end }: { start: number; end: number }): number => {
    const sum = (sums[end] ?? 0) - (sums[start] ?? 0);
    return (squares[end] ?? 0) - (squares[start] ?? 0) - (sum * sum) / (end - start);
  };
  const best = new Float64Array(valueCount + 1).fill(Infinity);
  best[0] = -beta;
  const last = new Int32Array(valueCount + 1);
  let candidates: number[] = [0];
  for (let end = minBins; end <= valueCount; end++) {
    const fresh = end - minBins;
    if (fresh >= minBins && (best[fresh] ?? Infinity) < Infinity) candidates.push(fresh);
    let value = Infinity;
    let bestStart = 0;
    for (const start of candidates) {
      if (end - start < minBins) continue;
      const total = (best[start] ?? Infinity) + cost({ start, end }) + beta;
      if (total < value) {
        value = total;
        bestStart = start;
      }
    }
    best[end] = value;
    last[end] = bestStart;
    if (value < Infinity) {
      candidates = candidates.filter(
        (start) =>
          end - start < minBins || (best[start] ?? Infinity) + cost({ start, end }) <= value,
      );
    }
  }
  return changesFrom({ last, valueCount });
};
