import type { TrainingSession } from '@/packages/engine/types.ts';

const BUFFER_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

const toLocalDate = (ms: number): string => {
  const date = new Date(ms);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

export const intervalsSyncWindowOldest = (sessions: TrainingSession[]): string | undefined => {
  let newest: number | undefined = undefined;
  for (const session of sessions) {
    if (session.source.kind !== 'intervals') continue;
    if (newest === undefined || session.date > newest) newest = session.date;
  }
  if (newest === undefined) return undefined;
  return toLocalDate(newest - BUFFER_DAYS * DAY_MS);
};
