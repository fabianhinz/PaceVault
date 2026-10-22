export type CrashTarget = 'root' | 'route' | 'map';

let crashTarget: CrashTarget | null = null;
const listeners = new Set<() => void>();

const notify = () => {
  for (const listener of listeners) {
    listener();
  }
};

export const subscribeCrash = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getCrashTarget = () => crashTarget;

export const triggerCrash = (target: CrashTarget) => {
  crashTarget = target;
  notify();
};

export const clearCrash = () => {
  crashTarget = null;
};
