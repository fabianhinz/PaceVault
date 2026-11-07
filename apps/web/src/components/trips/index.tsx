import type { FC } from 'react';
import { useRouterParam } from '@/routing/useRouterParam.ts';
import { m } from '@pacevault/i18n/messages.js';
import { useTripsStore } from '@/store/trips.ts';
import { NotFoundBanner } from '@/components/errors/NotFoundBanner.tsx';
import { TripDetail } from '@/components/trips/TripDetail.tsx';

export const Trips: FC = () => {
  const id = useRouterParam('id');
  const trip = useTripsStore((s) => s.trips.find((t) => t.id === id));

  if (!trip) {
    return <NotFoundBanner>{m.ui_trips_not_found()}</NotFoundBanner>;
  }

  return <TripDetail trip={trip} />;
};
