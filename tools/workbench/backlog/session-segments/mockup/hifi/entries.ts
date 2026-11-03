export type EntryRole = 'latest' | 'mid' | 'best';

interface EntryCandidate {
  sessionId: string;
  seconds: number;
  date: number;
}

const ROLE_ORDER: EntryRole[] = ['latest', 'mid', 'best'];

// Mockup control only: a few representative origin sessions per segment.
export const entryPasses = <T extends EntryCandidate>(passes: T[]): Array<{ pass: T; role: EntryRole }> => {
  const byTime = [...passes].sort((a, b) => a.seconds - b.seconds);
  const byDate = [...passes].sort((a, b) => b.date - a.date);
  const best = byTime[0];
  const latest = byDate[0];
  const rest = byTime.filter((p) => p !== best && p !== latest);
  const mid = rest[Math.floor(rest.length / 2)];
  const picked: Array<{ pass: T; role: EntryRole }> = [];
  const add = (pass: T | undefined, role: EntryRole) => {
    if (pass === undefined || picked.some((p) => p.pass.sessionId === pass.sessionId)) return;
    picked.push({ pass, role });
  };
  add(latest, 'latest');
  add(mid, 'mid');
  add(best, 'best');
  return picked.sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));
};

export const ROLE_LABEL: Record<EntryRole, string> = { latest: 'latest', mid: 'mid', best: 'best' };

export const entryDate = (date: number) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);

export const entryLabel = ({ date, role }: { date: number; role: EntryRole }) => `Session · ${entryDate(date)} · ${ROLE_LABEL[role]}`;
