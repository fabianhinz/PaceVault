import type { WorkoutStep } from '@/types.ts';

type GroupedStep =
  | { kind: 'single'; step: WorkoutStep }
  | { kind: 'interval'; repeat: number; steps: WorkoutStep[] };

const collectRepeatGroup = ({
  steps,
  start,
  repeat,
}: {
  steps: WorkoutStep[];
  start: number;
  repeat: number;
}): { group: WorkoutStep[]; next: number } => {
  const group: WorkoutStep[] = [];
  let j = start;
  while (j < steps.length) {
    const s = steps[j];
    if (!s || s.repeat !== repeat) break;
    group.push(s);
    j++;
  }
  return { group, next: j };
};

export const groupSteps = (steps: WorkoutStep[]): GroupedStep[] => {
  const result: GroupedStep[] = [];
  let i = 0;
  while (i < steps.length) {
    const current = steps[i];
    if (!current) break;
    const next = steps[i + 1];
    if (next && current.repeat && current.repeat > 1 && current.repeat === next.repeat) {
      const collected = collectRepeatGroup({ steps, start: i + 1, repeat: current.repeat });
      result.push({
        kind: 'interval',
        repeat: current.repeat,
        steps: [current, ...collected.group],
      });
      i = collected.next;
    } else {
      result.push({ kind: 'single', step: current });
      i++;
    }
  }
  return result;
};
