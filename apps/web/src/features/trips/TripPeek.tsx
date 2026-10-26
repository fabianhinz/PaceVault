import type { FC } from 'react';
import { PvSheetPeek } from '@pacevault/ui/components/pvBottomSheet/PvSheetPeek.tsx';
import { formatDistance, formatPlural } from '@/lib/formatters.ts';
import type { Trip } from '@/store/trips.ts';
import { m } from '@pacevault/i18n/messages.js';
import { TripBadge } from './TripBadge.tsx';
import { useTripSessions } from './hooks/useTripSessions.ts';
import { computeTripTotals } from './tripStats.ts';

interface TripPeekProps {
  trip: Trip;
}

export const TripPeek: FC<TripPeekProps> = (props) => {
  const totals = computeTripTotals(useTripSessions(props.trip));
  const details: string[] = [
    formatPlural(totals.count, {
      one: () => m.ui_count_sessions_one(),
      other: () => m.ui_count_sessions_other({ count: String(totals.count) }),
    }),
  ];
  if (totals.count > 0) {
    details.push(formatDistance(totals.distance));
  }
  return (
    <PvSheetPeek icon={<TripBadge />} primary={props.trip.name} secondary={details.join(' · ')} />
  );
};
