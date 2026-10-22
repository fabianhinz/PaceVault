import { buildIssueUrl } from '@/lib/crashReport.ts';
import { triggerCrash } from './crashSignal.ts';

const BOOT_CRASH_FLAG = 'pvDebug:crashBoot';

export const throwIfBootCrashRequested = () => {
  if (sessionStorage.getItem(BOOT_CRASH_FLAG) === null) return;
  sessionStorage.removeItem(BOOT_CRASH_FLAG);
  throw new Error('pvDebug: simulated boot failure');
};

export const crashCommands = {
  crashRoot: () => triggerCrash('root'),
  crashRoute: () => triggerCrash('route'),
  crashMap: () => triggerCrash('map'),
  crashBoot: () => {
    sessionStorage.setItem(BOOT_CRASH_FLAG, '1');
    window.location.reload();
  },
  reportUrl: (error?: unknown) => buildIssueUrl(error ?? new Error('pvDebug: test report')),
};

export const crashCommandDocs: Record<keyof typeof crashCommands, string> = {
  crashRoot: 'Root card — Reload + Report bug',
  crashRoute: 'Route card — Try again or navigate away',
  crashMap: 'Map vanishes, content keeps working',
  crashBoot: 'Reload + fail during boot — root card',
  reportUrl: 'GitHub issue URL for an optional error',
};
