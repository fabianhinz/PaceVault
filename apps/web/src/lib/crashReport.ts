import { useIntervalsStore } from '@/store/intervals.ts';

const NEW_ISSUE_URL = 'https://github.com/fabianhinz/PaceVault/issues/new';
const MAX_URL_LENGTH = 8000;
const MAX_TITLE_LENGTH = 120;

interface ErrorParts {
  name: string;
  message: string;
  stack: string;
}

const toErrorParts = (error: unknown): ErrorParts => {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack ?? '' };
  }
  return { name: 'Error', message: String(error), stack: '' };
};

const redact = (text: string) => {
  const apiKey = useIntervalsStore.getState().apiKey;
  if (!apiKey) return text;
  return text.replaceAll(apiKey, '[redacted]');
};

const displayMode = () => {
  if (typeof window.matchMedia !== 'function') return 'unknown';
  if (window.matchMedia('(display-mode: standalone)').matches) return 'installed PWA';
  return 'browser tab';
};

const buildBody = (parts: ErrorParts, stackLines: string[]) =>
  [
    `**${parts.name}:** ${parts.message}`,
    '',
    '```',
    stackLines.join('\n'),
    '```',
    '',
    `- Build: \`${import.meta.env.VITE_APP_COMMIT}\``,
    `- User agent: ${navigator.userAgent}`,
    `- Viewport: ${window.innerWidth}×${window.innerHeight}`,
    `- Display: ${displayMode()}`,
  ].join('\n');

const toUrl = (title: string, body: string) =>
  `${NEW_ISSUE_URL}?${new URLSearchParams({ title, body }).toString()}`;

export const buildIssueUrl = (error: unknown) => {
  const raw = toErrorParts(error);
  const parts = {
    name: redact(raw.name),
    message: redact(raw.message),
    stack: redact(raw.stack),
  };
  const title = `Crash: ${parts.name}: ${parts.message}`.slice(0, MAX_TITLE_LENGTH);
  const stackLines = parts.stack.split('\n');

  let url = toUrl(title, buildBody(parts, stackLines));
  while (url.length > MAX_URL_LENGTH && stackLines.length > 1) {
    stackLines.pop();
    url = toUrl(title, buildBody(parts, stackLines));
  }
  return url;
};
