import type { FC } from 'react';
import { usePageRouting } from '@/routing/usePageRouting.ts';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import type { Trip } from '@/store/trips.ts';
import { TripHeader } from './TripHeader.tsx';

interface TripItemProps {
  trip: Trip;
}

export const TripItem: FC<TripItemProps> = (props) => {
  const pageRouting = usePageRouting();

  return (
    <PvCard
      role="button"
      tabIndex={0}
      aria-label={props.trip.name}
      onClick={() => pageRouting.open({ page: 'tripDetail', params: { tripId: props.trip.id } })}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pageRouting.open({ page: 'tripDetail', params: { tripId: props.trip.id } });
        }
      }}
      className="cursor-pointer hover:bg-white/10"
    >
      <TripHeader trip={props.trip} />
    </PvCard>
  );
};
