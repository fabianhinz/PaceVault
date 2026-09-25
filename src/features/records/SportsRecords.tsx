import { PageGrid } from '@/components/ui/PageGrid.tsx';
import { useMemo } from 'react';
import { usePersonalBestsStore } from '@/store/personalBests.ts';
import { groupPBsBySport } from '@/lib/records.ts';
import type { Sport } from '@/packages/engine/types.ts';
import { SportRecordsCard } from './SportRecordsCard.tsx';

const sports: Sport[] = ['running', 'cycling'];

export const SportsRecords: React.FC = () => {
  const pbs = usePersonalBestsStore((s) => s.pbs);
  const groupedPBs = useMemo(() => groupPBsBySport(pbs), [pbs]);

  return (
    <PageGrid>
      {sports.map((sport) => (
        <SportRecordsCard key={sport} sport={sport} pbs={groupedPBs[sport]} />
      ))}
    </PageGrid>
  );
};
