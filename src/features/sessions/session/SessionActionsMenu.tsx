import { useState } from 'react';
import { Compass, EllipsisVertical, FileDown, Pencil, Trash2 } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { useTripsStore } from '@/store/trips.ts';
import { Button } from '@/components/ui/Button.tsx';
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/DropdownMenu.tsx';
import { formatDate } from '@/lib/formatters.ts';
import { RenameSessionDialog } from '@/features/sessions/session/RenameSessionDialog.tsx';
import { DeleteSessionDialog } from '@/features/sessions/session/DeleteSessionDialog.tsx';
import { ManageTripDialog } from '@/features/trips/ManageTripDialog.tsx';
import { useSessionExport } from '@/features/sessions/session/hooks/useSessionExport.ts';
import type { TrainingSession } from '@/packages/engine/types.ts';

export const SessionActionsMenu = (props: { session: TrainingSession }) => {
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showManageTripDialog, setShowManageTripDialog] = useState(false);
  const hasTrips = useTripsStore((s) => s.trips.length > 0);
  const gpxExport = useSessionExport(props.session);

  return (
    <>
      <DropdownMenuRoot>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={m.ui_session_actions()}>
            <EllipsisVertical size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setShowRenameDialog(true)}>
            <Pencil size={14} />
            {m.ui_btn_rename()}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!hasTrips} onSelect={() => setShowManageTripDialog(true)}>
            <Compass size={14} />
            {hasTrips ? m.ui_trips_manage() : m.ui_trips_manage_empty()}
          </DropdownMenuItem>
          {gpxExport.canExport ? (
            <DropdownMenuItem disabled={gpxExport.exporting} onSelect={() => gpxExport.exportGpx()}>
              <FileDown size={14} />
              {m.ui_btn_export_gpx()}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem variant="danger" onSelect={() => setShowDeleteDialog(true)}>
            <Trash2 size={14} />
            {m.ui_btn_delete()}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuRoot>

      <RenameSessionDialog
        session={props.session}
        open={showRenameDialog}
        onOpenChange={setShowRenameDialog}
        initialName={props.session.name ?? formatDate(props.session.date)}
      />

      <DeleteSessionDialog
        session={props.session}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />

      <ManageTripDialog
        sessionId={props.session.id}
        open={showManageTripDialog}
        onOpenChange={setShowManageTripDialog}
      />
    </>
  );
};
