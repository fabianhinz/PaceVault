import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/Button.tsx';
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/DropdownMenu.tsx';
import type { Trip } from '@/store/trips.ts';
import { TripFormDialog } from './TripFormDialog.tsx';
import { DeleteTripDialog } from './DeleteTripDialog.tsx';

export const TripActionsMenu = (props: { trip: Trip }) => {
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <DropdownMenuRoot>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={m.ui_trips_actions()}>
            <EllipsisVertical size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setShowEditDialog(true)}>
            <Pencil size={14} />
            {m.ui_trips_edit()}
          </DropdownMenuItem>
          <DropdownMenuItem variant="danger" onSelect={() => setShowDeleteDialog(true)}>
            <Trash2 size={14} />
            {m.ui_btn_delete()}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuRoot>

      <TripFormDialog trip={props.trip} open={showEditDialog} onOpenChange={setShowEditDialog} />

      <DeleteTripDialog
        tripId={props.trip.id}
        tripName={props.trip.name}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onDeleted={() => navigate('/sessions?tab=trips')}
      />
    </>
  );
};
