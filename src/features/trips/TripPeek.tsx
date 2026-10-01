import { SheetPeek } from '@/components/ui/SheetPeek.tsx';
import { formatDistance } from '@/lib/formatters.ts';
import type { Trip } from '@/store/trips.ts';
import { m } from '@/paraglide/messages.js';
import { TripBadge } from './TripBadge.tsx';
import { useTripSessions } from './hooks/useTripSessions.ts';
import { computeTripTotals } from './tripStats.ts';

export const TripPeek = (props: { trip: Trip }) => {
  const totals = computeTripTotals(useTripSessions(props.trip));
  const details: string[] = [
    totals.count === 1
      ? m.ui_count_sessions_one()
      : m.ui_count_sessions_other({ count: String(totals.count) }),
  ];
  if (totals.count > 0) {
    details.push(formatDistance(totals.distance));
  }
  return (
    <SheetPeek icon={<TripBadge />} primary={props.trip.name} secondary={details.join(' · ')} />
  );
};
