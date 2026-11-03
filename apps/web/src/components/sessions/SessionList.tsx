import { useMemo, type FC } from 'react';
import { useSessionsStore } from '@/store/sessions.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { VirtualItemList } from '@/components/layout/VirtualItemList.tsx';
import { SessionItem } from './SessionItem.tsx';
import { matchesFilters } from '@/lib/filtering/filters.ts';

const ESTIMATED_ROW_SIZE = 82;

export const SessionList: FC = () => {
  const sessions = useSessionsStore((s) => s.sessions);
  const activeFilter = useFiltersStore((s) => s.activeFilter);

  const filtered = useMemo(() => {
    const now = Date.now();
    return sessions
      .filter((s) => !s.isPlanned && matchesFilters({ session: s, criteria: activeFilter, now }))
      .sort((a, b) => b.date - a.date);
  }, [sessions, activeFilter]);

  return (
    <VirtualItemList
      items={filtered}
      estimatedRowSize={ESTIMATED_ROW_SIZE}
      itemKey={(session) => session.id}
      renderItem={(session) => <SessionItem session={session} />}
    />
  );
};
