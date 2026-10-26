import { useState, type FC } from 'react';
import { Compass } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { useTripsStore } from '@/store/trips.ts';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { TripItem } from './TripItem.tsx';
import { TripFormDialog } from './TripFormDialog.tsx';

export const TripsTab: FC = () => {
  const trips = useTripsStore((s) => s.trips);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {trips.map((trip) => (
        <TripItem key={trip.id} trip={trip} />
      ))}

      {trips.length === 0 && (
        <PvCard className="flex-row items-center gap-3">
          <Compass size={18} className="shrink-0 text-primary" />
          <div className="min-w-0">
            <PvTypography>{m.ui_trips_nudge_title()}</PvTypography>
            <PvTypography variant="caption" as="p">
              {m.ui_trips_nudge_desc()}
            </PvTypography>
          </div>
        </PvCard>
      )}

      <PvButton variant="primary" onClick={() => setShowCreateDialog(true)}>
        {m.ui_trips_cta_title()}
      </PvButton>

      <TripFormDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  );
};
