import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { m } from '@/paraglide/messages.js';
import { useTripsStore } from '@/store/trips.ts';
import type { Trip } from '@/store/trips.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { SessionItem } from '@/features/sessions/SessionItem.tsx';
import { TripHeader } from '@/features/trips/TripHeader.tsx';
import { TripActionsMenu } from '@/features/trips/TripActionsMenu.tsx';
import { TripStatsGrid } from '@/features/trips/TripStatsGrid.tsx';
import { useTripSessions } from '@/features/trips/hooks/useTripSessions.ts';

export const TripDetailPage = () => {
  const params = useParams<{ id: string }>();
  const trip = useTripsStore((s) => s.trips.find((t) => t.id === params.id));
  const sessionIds = trip?.sessionIds;

  useEffect(() => {
    useMapFocusStore.getState().setFocusedTripSessions(sessionIds ?? []);
    return () => {
      useMapFocusStore.getState().setFocusedTripSessions([]);
    };
  }, [sessionIds]);

  if (!trip) {
    return (
      <Typography variant="body1" color="textSecondary">
        {m.ui_trips_not_found()}
      </Typography>
    );
  }

  return <TripDetail trip={trip} />;
};

const TripDetail = (props: { trip: Trip }) => {
  const tripSessions = useTripSessions(props.trip);

  return (
    <div className="space-y-4">
      <TripHeader trip={props.trip} titleVariant="h2" titleAs="h1">
        <TripActionsMenu trip={props.trip} />
      </TripHeader>

      {props.trip.description && (
        <Card>
          <CardHeader title={m.ui_trips_notes_title()} />
          <Typography variant="body1" color="textSecondary" className="whitespace-pre-line">
            {props.trip.description}
          </Typography>
        </Card>
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
