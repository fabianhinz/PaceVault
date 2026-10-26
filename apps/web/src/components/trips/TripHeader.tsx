import type { ElementType, FC, ReactNode } from 'react';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import type { TypographyVariants } from '@pacevault/ui/components/pvTypography/types.ts';
import type { Trip } from '@/store/trips.ts';
import { TripBadge } from './TripBadge.tsx';
import { useTripSessions } from './hooks/useTripSessions.ts';
import { computeTripTotals, formatTripStatsLine } from './tripStats.ts';

interface TripHeaderProps {
  trip: Trip;
  titleVariant?: TypographyVariants;
  titleAs?: ElementType;
  children?: ReactNode;
}

export const TripHeader: FC<TripHeaderProps> = (props) => {
  const tripSessions = useTripSessions(props.trip);
  const statsLine = formatTripStatsLine(computeTripTotals(tripSessions));

  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <TripBadge />
        <div className="min-w-0">
          <PvTypography variant={props.titleVariant ?? 'subtitle1'} as={props.titleAs} noWrap>
            {props.trip.name}
          </PvTypography>
          <PvTypography variant="caption" as="p" color="textSecondary">
            {statsLine}
          </PvTypography>
        </div>
      </div>
      {props.children}
    </div>
  );
};
