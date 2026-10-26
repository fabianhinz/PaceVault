import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import type { Trip } from '@/store/trips.ts';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { PvCardHeader } from '@pacevault/ui/components/pvCardHeader/PvCardHeader.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { SessionItem } from '@/features/sessions/SessionItem.tsx';
import { TripHeader } from '@/features/trips/TripHeader.tsx';
import { TripActionsMenu } from '@/features/trips/TripActionsMenu.tsx';
import { TripStatsGrid } from '@/features/trips/TripStatsGrid.tsx';
import { TripPeek } from '@/features/trips/TripPeek.tsx';
import { useTripSessions } from '@/features/trips/hooks/useTripSessions.ts';

interface TripDetailProps {
  trip: Trip;
}

export const TripDetail: FC<TripDetailProps> = (props) => {
  const tripSessions = useTripSessions(props.trip);

  return (
    <div className="space-y-4">
      <TripPeek trip={props.trip} />
      <TripHeader trip={props.trip} titleVariant="h2" titleAs="h1">
        <TripActionsMenu trip={props.trip} />
      </TripHeader>

      {props.trip.description && (
        <PvCard>
          <PvCardHeader title={m.ui_trips_notes_title()} />
          <PvTypography variant="body1" color="textSecondary" className="whitespace-pre-line">
            {props.trip.description}
          </PvTypography>
        </PvCard>
      )}

      <TripStatsGrid sessions={tripSessions} />

      <div className="flex flex-col gap-2">
        {tripSessions.map((session) => (
          <SessionItem key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
};
