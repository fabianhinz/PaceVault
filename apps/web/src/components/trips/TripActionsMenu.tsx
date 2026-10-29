import { useState, type FC } from 'react';
import { usePageRouting } from '@/routing/usePageRouting.ts';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvDropdownMenu } from '@pacevault/ui/components/pvDropdownMenu/PvDropdownMenu.tsx';
import { PvDropdownMenuTrigger } from '@pacevault/ui/components/pvDropdownMenu/PvDropdownMenuTrigger.tsx';
import { PvDropdownMenuContent } from '@pacevault/ui/components/pvDropdownMenu/PvDropdownMenuContent.tsx';
import { PvDropdownMenuItem } from '@pacevault/ui/components/pvDropdownMenu/PvDropdownMenuItem.tsx';
import type { Trip } from '@/store/trips.ts';
import { TripFormDialog } from './TripFormDialog.tsx';
import { DeleteTripDialog } from './DeleteTripDialog.tsx';

interface TripActionsMenuProps {
  trip: Trip;
}

export const TripActionsMenu: FC<TripActionsMenuProps> = (props) => {
  const pageRouting = usePageRouting();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <PvDropdownMenu>
        <PvDropdownMenuTrigger asChild>
          <PvButton variant="ghost" size="icon" aria-label={m.ui_trips_actions()}>
            <EllipsisVertical size={18} />
          </PvButton>
        </PvDropdownMenuTrigger>
        <PvDropdownMenuContent align="end">
          <PvDropdownMenuItem onSelect={() => setShowEditDialog(true)}>
            <Pencil size={14} />
            {m.ui_btn_edit()}
          </PvDropdownMenuItem>
          <PvDropdownMenuItem variant="danger" onSelect={() => setShowDeleteDialog(true)}>
            <Trash2 size={14} />
            {m.ui_btn_delete()}
          </PvDropdownMenuItem>
        </PvDropdownMenuContent>
      </PvDropdownMenu>

      <TripFormDialog trip={props.trip} open={showEditDialog} onOpenChange={setShowEditDialog} />

      <DeleteTripDialog
        tripId={props.trip.id}
        tripName={props.trip.name}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onDeleted={() => pageRouting.open({ page: 'sessions', params: { tab: 'trips' } })}
      />
    </>
  );
};
