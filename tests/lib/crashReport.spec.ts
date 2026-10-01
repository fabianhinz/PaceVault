import { describe, it, expect } from 'vitest';
import { buildIssueUrl } from '@/lib/crashReport.ts';
import { useIntervalsStore } from '@/store/intervals.ts';

const KEY = 'secret-intervals-key';

const errorWithStack = (message: string, frames: number) => {
  const error = new Error(message);
  const lines = Array.from(
    { length: frames },
    (_, i) => `    at frame${i} (https://pacevault.app/assets/index-D4f.js:1:${i})`,
  );
  error.stack = [`Error: ${message}`, ...lines].join('\n');
  return error;
};

const issueText = (url: string) => {
  const params = new URL(url).searchParams;
  return `${params.get('title')}\n${params.get('body')}`;
};

describe('buildIssueUrl', () => {
  it('never puts the intervals.icu API key into the issue URL', () => {
    useIntervalsStore.getState().connectIntervals(KEY);
    const error = new Error(`Request failed for key ${KEY}`);
    error.stack = `Error: Request failed for key ${KEY}\n    at fetch (https://intervals.icu/?key=${KEY})`;

    const url = buildIssueUrl(error);

    expect(url).not.toContain(KEY);
    expect(decodeURIComponent(url)).not.toContain(KEY);
    expect(issueText(url)).toContain('[redacted]');
  });

  it('truncates an oversized stack under the URL limit and keeps the message and top frame', () => {
    const url = buildIssueUrl(errorWithStack('Cannot read properties of undefined', 2000));
    const text = issueText(url);

    expect(url.length).toBeLessThanOrEqual(8000);
    expect(text).toContain('Cannot read properties of undefined');
    expect(text).toContain('at frame0 ');
    expect(text).not.toContain('at frame1999 ');
  });
});
