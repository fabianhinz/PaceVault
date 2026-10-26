import { useState, type FC } from 'react';
import { Compass, FileDown, Route, Trash2 } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { useTripsStore } from '@/store/trips.ts';
import { PvActionsMenu } from '@pacevault/ui/components/pvActionsMenu/PvActionsMenu.tsx';
import { DeleteSessionDialog } from '@/features/sessions/session/DeleteSessionDialog.tsx';
import { ManageTripDialog } from '@/features/trips/ManageTripDialog.tsx';
import { useSessionExport } from '@/features/sessions/session/hooks/useSessionExport.ts';
import { useEditInStudio } from '@/features/sessions/session/hooks/useEditInStudio.ts';
import type { TrainingSession } from '@pacevault/engine/types.ts';

interface SessionActionsMenuProps {
  session: TrainingSession;
}

export const SessionActionsMenu: FC<SessionActionsMenuProps> = (props) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showManageTripDialog, setShowManageTripDialog] = useState(false);
  const tripsPresent = useTripsStore((s) => s.trips.length > 0);
  const gpxExport = useSessionExport(props.session);
  const editInStudio = useEditInStudio(props.session);

  const items = [
    {
      id: 'manage-trip',
      icon: Compass,
      label: tripsPresent ? m.ui_trips_manage() : m.ui_trips_manage_empty(),
      disabled: !tripsPresent,
      onSelect: () => setShowManageTripDialog(true),
    },
  ];
  if (editInStudio.editable) {
    items.push({
      id: 'edit-in-studio',
      icon: Route,
      label: m.ui_session_edit_in_studio(),
      disabled: editInStudio.preparing,
      onSelect: () => void editInStudio.editInStudio(),
    });
  }
  if (gpxExport.exportable) {
    items.push({
      id: 'export-gpx',
      icon: FileDown,
      label: m.ui_btn_export_gpx(),
      disabled: gpxExport.exporting,
      onSelect: () => void gpxExport.exportGpx(),
    });
  }

  return (
    <>
      <PvActionsMenu
        closeLabel={m.ui_sheet_drag_close()}
        label={m.ui_session_actions()}
        items={[
          ...items,
          {
            id: 'delete',
            icon: Trash2,
            label: m.ui_btn_delete(),
            danger: true,
            onSelect: () => setShowDeleteDialog(true),
          },
        ]}
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
