import { PvPageGrid } from '@pacevault/ui/components/pvPageGrid/PvPageGrid.tsx';
import { useMemo, type FC } from 'react';
import { groupPBsBySport } from '@/lib/records.ts';
import { SPORTS } from '@pacevault/engine/types.ts';
import { SportRecordsCard } from './SportRecordsCard.tsx';
import { usePersonalBests } from '@/queries/records/usePersonalBests.ts';

export const Records: FC = () => {
  const personalBests = usePersonalBests();
  const groupedPBs = useMemo(() => groupPBsBySport(personalBests.data ?? []), [personalBests.data]);

  return (
    <PvPageGrid>
      {SPORTS.map((sport) => (
        <SportRecordsCard
          key={sport}
          sport={sport}
          pbs={groupedPBs[sport]}
          loading={personalBests.isPending}
        />
      ))}
    </PvPageGrid>
  );
};
