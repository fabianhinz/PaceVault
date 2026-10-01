import { useSyncExternalStore } from 'react';
import { clearCrash, getCrashTarget, subscribeCrash, type CrashTarget } from './crashSignal.ts';

interface CrashTriggerProps {
  target: CrashTarget;
}

export const CrashTrigger = (props: CrashTriggerProps) => {
  const target = useSyncExternalStore(subscribeCrash, getCrashTarget);
  if (target === props.target) {
    setTimeout(clearCrash, 0);
    throw new Error(`pvDebug: simulated ${props.target} crash`);
  }
  return null;
};
