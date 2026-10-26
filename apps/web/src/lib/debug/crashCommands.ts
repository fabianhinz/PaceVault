import { buildIssueUrl } from '@/lib/crashReport.ts';
import { requestBootCrash, triggerCrash } from './crashSignal.ts';

const crashRoot = () => triggerCrash('root');

const crashRoute = () => triggerCrash('route');

const crashMap = () => triggerCrash('map');

const crashBoot = () => {
  requestBootCrash();
  window.location.reload();
};

const reportUrl = (error?: unknown) => buildIssueUrl(error ?? new Error('pvDebug: test report'));

export const crashCommands = {
  crashRoot,
  crashRoute,
  crashMap,
  crashBoot,
  reportUrl,
};
