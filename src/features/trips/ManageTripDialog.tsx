import { m } from '@/paraglide/messages.js';
import { useTripsStore } from '@/store/trips.ts';
import { Button } from '@/components/ui/Button.tsx';
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog.tsx';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup.tsx';
import { TripHeader } from './TripHeader.tsx';

export const ManageTripDialog = (props: {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const trips = useTripsStore((s) => s.trips);
  const currentTrip = trips.find((t) => t.sessionIds.includes(props.sessionId));

  const handleSelect = (tripId: string) => {
    useTripsStore.getState().assignSession(props.sessionId, tripId);
  };

  const handleRemove = () => {
    if (currentTrip) {
      useTripsStore.getState().removeSessionFromTrip(props.sessionId, currentTrip.id);
    }
    props.onOpenChange(false);
  };

  return (
    <DialogRoot open={props.open} onOpenChange={() => props.onOpenChange(false)}>
      <DialogContent className="flex flex-col overflow-y-hidden">
        <DialogTitle className="shrink-0">{m.ui_trips_dialog_title()}</DialogTitle>
        <DialogDescription className="shrink-0">{m.ui_trips_dialog_desc()}</DialogDescription>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto border-t border-white/10 pt-4">
          <RadioGroup value={currentTrip?.id} onValueChange={handleSelect}>
            {trips.map((trip) => (
              <RadioGroupItem
                key={trip.id}
                value={trip.id}
                className="cursor-pointer rounded-xl border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10 data-[state=checked]:bg-white/10"
              >
                <TripHeader trip={trip} />
              </RadioGroupItem>
            ))}
          </RadioGroup>
        </div>

        <div className="mt-4 flex shrink-0 justify-end gap-2">
          <Button variant="secondary" onClick={() => props.onOpenChange(false)}>
            {m.ui_btn_cancel()}
          </Button>
          <Button variant="danger" disabled={!currentTrip} onClick={handleRemove}>
            {m.ui_trips_remove()}
          </Button>
        </div>
      </DialogContent>
    </DialogRoot>
  );
};
