import type { ComponentProps, FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { useTripsStore } from '@/store/trips.ts';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvDialog } from '@pacevault/ui/components/pvDialog/PvDialog.tsx';
import { PvDialogContent } from '@pacevault/ui/components/pvDialog/PvDialogContent.tsx';
import { PvDialogHeader } from '@pacevault/ui/components/pvDialog/PvDialogHeader.tsx';
import { PvDialogBody } from '@pacevault/ui/components/pvDialog/PvDialogBody.tsx';
import { PvDialogFooter } from '@pacevault/ui/components/pvDialog/PvDialogFooter.tsx';
import { PvDialogDescription } from '@pacevault/ui/components/pvDialog/PvDialogDescription.tsx';

interface DeleteTripDialogProps extends Required<
  Pick<ComponentProps<typeof PvDialog>, 'open' | 'onOpenChange'>
> {
  tripId: string;
  tripName: string;
  onDeleted?: () => void;
}

export const DeleteTripDialog: FC<DeleteTripDialogProps> = (props) => {
  return (
    <PvDialog open={props.open} onOpenChange={() => props.onOpenChange(false)}>
      <PvDialogContent closeLabel={m.ui_sheet_drag_close()}>
        <PvDialogHeader title={m.ui_trips_delete_title()} />
        <PvDialogBody>
          <PvDialogDescription>
            {m.ui_trips_delete_desc({ name: props.tripName })}
          </PvDialogDescription>
        </PvDialogBody>
        <PvDialogFooter>
          <PvButton variant="secondary" onClick={() => props.onOpenChange(false)}>
            {m.ui_btn_cancel()}
          </PvButton>
          <PvButton
            variant="danger"
            onClick={() => {
              useTripsStore.getState().deleteTrip(props.tripId);
              props.onOpenChange(false);
              props.onDeleted?.();
            }}
          >
            {m.ui_btn_delete()}
          </PvButton>
        </PvDialogFooter>
      </PvDialogContent>
    </PvDialog>
  );
};
