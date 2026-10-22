import { useState } from 'react';
import { Compass, FileDown, Route, Trash2 } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { useTripsStore } from '@/store/trips.ts';
import { ActionsMenu } from '@pacevault/ui/components/ActionsMenu.tsx';
import { DeleteSessionDialog } from '@/features/sessions/session/DeleteSessionDialog.tsx';
import { ManageTripDialog } from '@/features/trips/ManageTripDialog.tsx';
import { useSessionExport } from '@/features/sessions/session/hooks/useSessionExport.ts';
import { useEditInStudio } from '@/features/sessions/session/hooks/useEditInStudio.ts';
import type { TrainingSession } from '@pacevault/engine/types.ts';

export const SessionActionsMenu = (props: { session: TrainingSession }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showManageTripDialog, setShowManageTripDialog] = useState(false);
  const hasTrips = useTripsStore((s) => s.trips.length > 0);
  const gpxExport = useSessionExport(props.session);
  const editInStudio = useEditInStudio(props.session);

  const items = [
    {
      icon: Compass,
      label: hasTrips ? m.ui_trips_manage() : m.ui_trips_manage_empty(),
      disabled: !hasTrips,
      onSelect: () => setShowManageTripDialog(true),
    },
  ];
  if (editInStudio.canEdit) {
    items.push({
      icon: Route,
      label: m.ui_session_edit_in_studio(),
      disabled: editInStudio.preparing,
      onSelect: () => editInStudio.editInStudio(),
    });
  }
  if (gpxExport.canExport) {
    items.push({
      icon: FileDown,
      label: m.ui_btn_export_gpx(),
      disabled: gpxExport.exporting,
      onSelect: () => gpxExport.exportGpx(),
    });
  }

  return (
    <>
      <ActionsMenu
        label={m.ui_session_actions()}
        items={[
          ...items,
          {
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
