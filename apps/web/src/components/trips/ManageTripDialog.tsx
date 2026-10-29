import type { ComponentProps, FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { useTripsStore } from '@/store/trips.ts';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { TILE_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { PvDialog } from '@pacevault/ui/components/pvDialog/PvDialog.tsx';
import { PvDialogContent } from '@pacevault/ui/components/pvDialog/PvDialogContent.tsx';
import { PvDialogHeader } from '@pacevault/ui/components/pvDialog/PvDialogHeader.tsx';
import { PvDialogBody } from '@pacevault/ui/components/pvDialog/PvDialogBody.tsx';
import { PvDialogFooter } from '@pacevault/ui/components/pvDialog/PvDialogFooter.tsx';
import { PvDialogDescription } from '@pacevault/ui/components/pvDialog/PvDialogDescription.tsx';
import { PvRadioGroup } from '@pacevault/ui/components/pvRadioGroup/PvRadioGroup.tsx';
import { PvRadioGroupItem } from '@pacevault/ui/components/pvRadioGroup/PvRadioGroupItem.tsx';
import { TripHeader } from './TripHeader.tsx';

interface ManageTripDialogProps extends Required<
  Pick<ComponentProps<typeof PvDialog>, 'open' | 'onOpenChange'>
> {
  sessionId: string;
}

export const ManageTripDialog: FC<ManageTripDialogProps> = (props) => {
  const trips = useTripsStore((s) => s.trips);
  const currentTrip = trips.find((t) => t.sessionIds.includes(props.sessionId));

  const handleSelect = (tripId: string) => {
    useTripsStore.getState().assignSession({ sessionId: props.sessionId, tripId });
  };

  const handleRemove = () => {
    if (currentTrip) {
      useTripsStore
        .getState()
        .removeSessionFromTrip({ sessionId: props.sessionId, tripId: currentTrip.id });
    }
    props.onOpenChange(false);
  };

  return (
    <PvDialog open={props.open} onOpenChange={() => props.onOpenChange(false)}>
      <PvDialogContent
        closeLabel={m.ui_sheet_drag_close()}
        className="lg:flex lg:flex-col lg:overflow-y-hidden"
      >
        <PvDialogHeader title={m.ui_trips_dialog_title()} />
        <PvDialogBody>
          <PvDialogDescription className="shrink-0">{m.ui_trips_dialog_desc()}</PvDialogDescription>

          <div className="mt-4 border-t border-white/10 pt-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            <PvRadioGroup value={currentTrip?.id} onValueChange={handleSelect}>
              {trips.map((trip) => (
                <PvRadioGroupItem
                  key={trip.id}
                  value={trip.id}
                  aria-label={trip.name}
                  className={cn(
                    TILE_CLASS,
                    'cursor-pointer p-3 transition-colors hover:bg-white/10 data-[state=checked]:bg-white/10',
                  )}
                >
                  <TripHeader trip={trip} />
                </PvRadioGroupItem>
              ))}
            </PvRadioGroup>
          </div>
        </PvDialogBody>

        <PvDialogFooter>
          <PvButton variant="secondary" onClick={() => props.onOpenChange(false)}>
            {m.ui_btn_cancel()}
          </PvButton>
          <PvButton variant="danger" disabled={!currentTrip} onClick={handleRemove}>
            {m.ui_trips_remove()}
          </PvButton>
        </PvDialogFooter>
      </PvDialogContent>
    </PvDialog>
  );
};
