import { PageGrid } from '@/components/ui/PageGrid.tsx';
import { useFiltersStore } from '@/store/filters.ts';
import type { Sport } from '@/packages/engine/types.ts';
import { SportRecordsCard } from './SportRecordsCard.tsx';

const sports: Sport[] = ['running', 'cycling'];

export const SportsRecords: React.FC = () => {
  const groupedPBs = useFiltersStore((s) => s.groupedPBs);

  return (
    <PageGrid>
      {sports.map((sport) => (
        <SportRecordsCard
          key={sport}
          sport={sport}
          pbs={groupedPBs.data[sport]}
          loading={groupedPBs.loading}
        />
      ))}
    </PageGrid>
  );
};
