import { describe, it, expect } from 'vite-plus/test';
import { markSessionsOutdated } from '@/lib/debug/migrationCommands.ts';
import { SESSION_DERIVATION_VERSION } from '@pacevault/engine/sessionDerivation.ts';

const persisted = () => ({
  state: {
    sessions: [
      { id: 'old', date: 1_000, derivationVersion: SESSION_DERIVATION_VERSION },
      { id: 'newest', date: 3_000, derivationVersion: SESSION_DERIVATION_VERSION },
      { id: 'middle', date: 2_000, derivationVersion: SESSION_DERIVATION_VERSION },
    ],
    personalBests: [],
  },
  version: 3,
});

const versionsById = (result: ReturnType<typeof markSessionsOutdated>) =>
  Object.fromEntries(result.persisted.state.sessions.map((s) => [s.id, s.derivationVersion]));

describe('markSessionsOutdated', () => {
  it('marks every session one version behind and keeps the rest of the state', () => {
    const result = markSessionsOutdated(persisted());

    expect(result.marked).toBe(3);
    expect(versionsById(result)).toEqual({
      old: SESSION_DERIVATION_VERSION - 1,
      newest: SESSION_DERIVATION_VERSION - 1,
      middle: SESSION_DERIVATION_VERSION - 1,
    });
    expect(result.persisted.version).toBe(3);
    expect(result.persisted.state.personalBests).toEqual([]);
  });

  it('marks only the newest N sessions by date', () => {
    const result = markSessionsOutdated(persisted(), 2);

    expect(result.marked).toBe(2);
    expect(versionsById(result)).toEqual({
      old: SESSION_DERIVATION_VERSION,
      newest: SESSION_DERIVATION_VERSION - 1,
      middle: SESSION_DERIVATION_VERSION - 1,
    });
  });
});
