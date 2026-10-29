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

const BOOT_CRASH_FLAG = 'pvDebug:crashBoot';

export const requestBootCrash = () => {
  sessionStorage.setItem(BOOT_CRASH_FLAG, '1');
};

export const throwIfBootCrashRequested = () => {
  if (sessionStorage.getItem(BOOT_CRASH_FLAG) === null) return;
  sessionStorage.removeItem(BOOT_CRASH_FLAG);
  throw new Error('pvDebug: simulated boot failure');
};
