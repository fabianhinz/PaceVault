import { describe, it, expect, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReimport } from '@/features/settings/hooks/useReimport.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { bulkSaveSessionData, getSessionRecords } from '@/lib/indexeddb.ts';
import { makeSession } from '@tests/factories/sessions.ts';
import { makeUserProfile } from '@tests/factories/profiles.ts';
import { makeCyclingRecords, makeLaps } from '@tests/factories/records.ts';

const events = vi.hoisted((): string[] => []);

vi.mock('@/lib/indexeddb.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/indexeddb.ts')>();
  return {
    ...original,
    getFitFile: async (sessionId: string) => {
      const file = await original.getFitFile(sessionId);
      events.push(`load ${file?.fileName}`);
      return file;
    },
  };
});

vi.mock('@/parsers/fit.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/parsers/fit.ts')>();
  return {
    ...original,
    parseFitFile: async (_data: ArrayBuffer, fileName: string) => {
      events.push(`parse ${fileName}`);
      const { id: _id, createdAt: _ca, source: _source, ...session } = makeSession({ tss: 77 });
      return {
        session,
        records: makeCyclingRecords(20, { basePower: 200 }),
        laps: makeLaps(1),
        fingerprint: fileName,
      };
    },
  };
});

describe('useReimport', () => {
  it('reimport loads one FIT file at a time and still refreshes every session', async () => {
    useUserStore.setState({ profile: makeUserProfile() });
    const names = ['a.fit', 'b.fit', 'c.fit'];
    const sessions = names.map((name) => {
      const { createdAt: _ca, ...session } = makeSession({ id: `session-${name}`, name, tss: 10 });
      return session;
    });
    useSessionsStore.getState().addSessions(sessions);
    const ids = sessions.map((session) => session.id);
    const fileNameById = new Map<string, string>();
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i] ?? '';
      const name = names[i] ?? '';
      fileNameById.set(id, name);
      await bulkSaveSessionData([
        {
          sessionId: id,
          records: [],
          laps: [],
          fit: { fileName: name, data: new Uint8Array([i]).buffer },
        },
      ]);
    }
    events.length = 0;

    const queryClient = new QueryClient();
    const wrapper = (props: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, props.children);
    const hook = renderHook(() => useReimport(), { wrapper });

    await act(() => hook.result.current.reimportAll());

    const storedOrder = [...fileNameById.keys()].sort().map((id) => fileNameById.get(id));
    expect(events).toEqual(storedOrder.flatMap((name) => [`load ${name}`, `parse ${name}`]));
    expect(useSessionsStore.getState().sessions.map((s) => s.tss)).toEqual([77, 77, 77]);
    for (const id of ids) {
      expect(await getSessionRecords(id)).toHaveLength(20);
    }
    expect(hook.result.current.reimporting).toBe(false);
  });
});
