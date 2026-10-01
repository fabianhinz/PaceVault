import { PageGrid } from '@/components/ui/PageGrid.tsx';
import { useMemo } from 'react';
import { groupPBsBySport } from '@/lib/records.ts';
import { SPORTS } from '@/packages/engine/types.ts';
import { SportRecordsCard } from './SportRecordsCard.tsx';
import { usePersonalBests } from './hooks/usePersonalBests.ts';

export const SportsRecords: React.FC = () => {
  const query = usePersonalBests();
  const groupedPBs = useMemo(() => groupPBsBySport(query.data ?? []), [query.data]);

  return (
    <PageGrid>
      {SPORTS.map((sport) => (
        <SportRecordsCard
          key={sport}
          sport={sport}
          pbs={groupedPBs[sport]}
          loading={query.isPending}
        />
      ))}
    </PageGrid>
  );
};
