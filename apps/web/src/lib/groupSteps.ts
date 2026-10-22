import type { WorkoutStep } from '@/types/index.ts';

type GroupedStep =
  | { kind: 'single'; step: WorkoutStep }
  | { kind: 'interval'; repeat: number; steps: WorkoutStep[] };

export const groupSteps = (steps: WorkoutStep[]): GroupedStep[] => {
  const result: GroupedStep[] = [];
  let i = 0;
  while (i < steps.length) {
    const current = steps[i];
    if (!current) break;
    const next = steps[i + 1];
    if (next && current.repeat && current.repeat > 1 && current.repeat === next.repeat) {
      const group: WorkoutStep[] = [current];
      let j = i + 1;
      while (j < steps.length) {
        const s = steps[j];
        if (!s || s.repeat !== current.repeat) break;
        group.push(s);
        j++;
      }
      result.push({ kind: 'interval', repeat: current.repeat, steps: group });
      i = j;
    } else {
      result.push({ kind: 'single', step: current });
      i++;
    }
  }
  return result;
};
