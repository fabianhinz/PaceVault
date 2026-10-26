import type { FC } from 'react';
import { useRouterParam } from '@/routing/useRouterParam.ts';
import { m } from '@pacevault/i18n/messages.js';
import { useTripsStore } from '@/store/trips.ts';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { TripDetail } from '@/components/trips/TripDetail.tsx';
import { useTripMapFocusEffect } from '@/components/trips/hooks/useTripMapFocusEffect.ts';

export const Trips: FC = () => {
  const id = useRouterParam('id');
  const trip = useTripsStore((s) => s.trips.find((t) => t.id === id));
  const sessionIds = trip?.sessionIds;

  useTripMapFocusEffect(sessionIds);

  if (!trip) {
    return (
      <PvTypography variant="body1" color="textSecondary">
        {m.ui_trips_not_found()}
      </PvTypography>
    );
  }

  return <TripDetail trip={trip} />;
};
