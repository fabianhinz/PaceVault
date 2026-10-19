import { m } from '@pacevault/i18n/messages.js';
import { useTripsStore } from '@/store/trips.ts';
import { Button } from '@pacevault/ui/components/Button.tsx';
import { tileClass } from '@pacevault/ui/components/Card.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogDescription,
} from '@pacevault/ui/components/Dialog.tsx';
import { RadioGroup, RadioGroupItem } from '@pacevault/ui/components/RadioGroup.tsx';
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
      <DialogContent className="lg:flex lg:flex-col lg:overflow-y-hidden">
        <DialogHeader title={m.ui_trips_dialog_title()} />
        <DialogBody>
          <DialogDescription className="shrink-0">{m.ui_trips_dialog_desc()}</DialogDescription>

          <div className="mt-4 border-t border-white/10 pt-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            <RadioGroup value={currentTrip?.id} onValueChange={handleSelect}>
              {trips.map((trip) => (
                <RadioGroupItem
                  key={trip.id}
                  value={trip.id}
                  className={cn(
                    tileClass,
                    'cursor-pointer p-3 transition-colors hover:bg-white/10 data-[state=checked]:bg-white/10',
                  )}
                >
                  <TripHeader trip={trip} />
                </RadioGroupItem>
              ))}
            </RadioGroup>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={() => props.onOpenChange(false)}>
            {m.ui_btn_cancel()}
          </Button>
          <Button variant="danger" disabled={!currentTrip} onClick={handleRemove}>
            {m.ui_trips_remove()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};
