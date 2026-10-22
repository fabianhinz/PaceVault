import type { CrashTarget } from './crashSignal.ts';
import { CrashTrigger } from './CrashTrigger.tsx';

interface DebugCrashTriggerProps {
  target: CrashTarget;
}

export const DebugCrashTrigger = (props: DebugCrashTriggerProps) =>
  import.meta.env.DEV ? <CrashTrigger target={props.target} /> : null;
