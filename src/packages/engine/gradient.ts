export interface GradientPoint {
  distance?: number;
  elevation?: number | null;
}

export const GRADIENT_WINDOW_M = 50;

interface GradientNode {
  distance: number;
  elevation: number;
  indices: number[];
}

const splitIntoRuns = (points: GradientPoint[]): GradientNode[][] => {
  const runs: GradientNode[][] = [];
  let run: GradientNode[] = [];
  let sum = 0;
  const closeRun = () => {
    if (run.length > 0) runs.push(run);
    run = [];
  };
  points.forEach((point, index) => {
    if (point.distance === undefined) return;
    if (point.elevation === undefined || point.elevation === null) {
      closeRun();
      return;
    }
    const last = run[run.length - 1];
    if (last && point.distance < last.distance) closeRun();
    const current = run[run.length - 1];
    if (current && point.distance === current.distance) {
      current.indices.push(index);
      sum += point.elevation;
      current.elevation = sum / current.indices.length;
      return;
    }
    sum = point.elevation;
    run.push({ distance: point.distance, elevation: point.elevation, indices: [index] });
  });
  closeRun();
  return runs;
};

const runGradients = (run: GradientNode[]): Array<number | undefined> => {
  const gradients: Array<number | undefined> = [];
  let lo = 0;
  let hi = 0;
  run.forEach((node, i) => {
    let next = run[lo + 1];
    while (next && node.distance - next.distance >= GRADIENT_WINDOW_M / 2) {
      lo++;
      next = run[lo + 1];
    }
    if (hi < i) hi = i;
    let ahead = run[hi];
    while (ahead && ahead.distance - node.distance < GRADIENT_WINDOW_M / 2 && hi < run.length - 1) {
      hi++;
      ahead = run[hi];
    }
    const start = run[lo];
    const end = run[hi];
    if (!start || !end) {
      gradients.push(undefined);
      return;
    }
    const span = end.distance - start.distance;
    if (span < GRADIENT_WINDOW_M / 2) {
      gradients.push(undefined);
      return;
    }
    gradients.push((end.elevation - start.elevation) / span);
  });
  return gradients;
};

export const windowedGradients = (points: GradientPoint[]): Array<number | undefined> => {
  const result: Array<number | undefined> = Array.from({ length: points.length }, () => undefined);
  for (const run of splitIntoRuns(points)) {
    const gradients = runGradients(run);
    run.forEach((node, i) => {
      for (const index of node.indices) result[index] = gradients[i];
    });
  }
  return result;
};
