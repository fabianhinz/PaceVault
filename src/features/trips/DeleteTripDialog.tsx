import { m } from '@/paraglide/messages.js';
import { useTripsStore } from '@/store/trips.ts';
import { Button } from '@/components/ui/Button.tsx';
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog.tsx';

export const DeleteTripDialog = (props: {
  tripId: string;
  tripName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  return (
    <DialogRoot open={props.open} onOpenChange={() => props.onOpenChange(false)}>
      <DialogContent>
        <DialogTitle>{m.ui_trips_delete_title()}</DialogTitle>
        <DialogDescription>{m.ui_trips_delete_desc({ name: props.tripName })}</DialogDescription>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => props.onOpenChange(false)}>
            {m.ui_btn_cancel()}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              useTripsStore.getState().deleteTrip(props.tripId);
              props.onOpenChange(false);
            }}
          >
            {m.ui_btn_delete()}
          </Button>
        </div>
      </DialogContent>
    </DialogRoot>
  );
};
