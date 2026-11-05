import { useQueries } from '@tanstack/react-query';
import type { SessionRecord } from '@pacevault/engine/types.ts';
import { loadSessionRecords } from '@/queries/sessions/useSessionRecords.ts';

const SESSION_RECORD_SLICES_QUERY_ROOT = 'session-record-slices';

export interface SessionRecordSlices<T> {
  sliceBySessionId: Map<string, T>;
  loading: boolean;
}

export const loadSessionRecordSlice = async <T>({
  sessionId,
  slice,
}: {
  sessionId: string;
  slice: (input: { sessionId: string; records: SessionRecord[] }) => T;
}): Promise<T> => slice({ sessionId, records: await loadSessionRecords({ sessionId }) });

export const sessionRecordSlicesQueryKey = (
  options: { scope?: string; sessionId?: string } = {},
): string[] => {
  if (options.scope === undefined) return [SESSION_RECORD_SLICES_QUERY_ROOT];
  if (options.sessionId === undefined) return [SESSION_RECORD_SLICES_QUERY_ROOT, options.scope];
  return [SESSION_RECORD_SLICES_QUERY_ROOT, options.scope, options.sessionId];
};

export const useSessionRecordSlices = <T>({
  scope,
  sessionIds,
  slice,
}: {
  scope: string;
  sessionIds: string[];
  slice: (input: { sessionId: string; records: SessionRecord[] }) => T;
}): SessionRecordSlices<T> =>
  useQueries({
    queries: sessionIds.map((sessionId) => ({
      queryKey: sessionRecordSlicesQueryKey({ scope, sessionId }),
      queryFn: () => loadSessionRecordSlice({ sessionId, slice }),
      staleTime: Infinity,
      networkMode: 'always' as const,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    })),
    combine: (results) => {
      const sliceBySessionId = new Map<string, T>();
      results.forEach((result, index) => {
        const sessionId = sessionIds[index];
        if (sessionId !== undefined && result.data !== undefined)
          sliceBySessionId.set(sessionId, result.data);
      });
      return { sliceBySessionId, loading: results.some((result) => result.isPending) };
    },
  });
