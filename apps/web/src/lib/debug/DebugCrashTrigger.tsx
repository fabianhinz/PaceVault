import type { FC } from 'react';
import type { CrashTarget } from './crashSignal.ts';
import { CrashTrigger } from './CrashTrigger.tsx';

interface DebugCrashTriggerProps {
  target: CrashTarget;
}

export const DebugCrashTrigger: FC<DebugCrashTriggerProps> = (props) =>
  import.meta.env.DEV ? <CrashTrigger target={props.target} /> : null;
