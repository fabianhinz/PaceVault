import { useState, type FC } from 'react';
import { Compass, FileDown, Route, Trash2 } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { useTripsStore } from '@/store/trips.ts';
import { PvActionsMenu } from '@pacevault/ui/components/pvActionsMenu/PvActionsMenu.tsx';
import type { ActionsMenuItem } from '@pacevault/ui/components/pvActionsMenu/types.ts';
import { DeleteSessionDialog } from '@/components/sessions/session/DeleteSessionDialog.tsx';
import { ManageTripDialog } from '@/components/trips/ManageTripDialog.tsx';
import { useSessionExport } from '@/components/sessions/session/hooks/useSessionExport.ts';
import { useEditInStudio } from '@/components/sessions/session/hooks/useEditInStudio.ts';
import type { TrainingSession } from '@pacevault/engine/types.ts';
import { CreateSegmentDialog } from '@/components/segments/CreateSegmentDialog.tsx';
import { useReferenceSegmentMenuEntry } from '@/components/segments/hooks/useReferenceSegmentMenuEntry.ts';

interface SessionActionsMenuProps {
  session: TrainingSession;
}

export const SessionActionsMenu: FC<SessionActionsMenuProps> = (props) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showManageTripDialog, setShowManageTripDialog] = useState(false);
  const tripsPresent = useTripsStore((s) => s.trips.length > 0);
  const gpxExport = useSessionExport(props.session);
  const editInStudio = useEditInStudio(props.session);
  const referenceSegmentMenuEntry = useReferenceSegmentMenuEntry(props.session);

  const items: ActionsMenuItem[] = [
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
  if (referenceSegmentMenuEntry.item !== null) items.push(referenceSegmentMenuEntry.item);
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

      <CreateSegmentDialog
        draft={referenceSegmentMenuEntry.draft}
        title={m.ui_segment_use_as_reference()}
        onClose={referenceSegmentMenuEntry.closeDraft}
      />

      <ManageTripDialog
        sessionId={props.session.id}
        open={showManageTripDialog}
        onOpenChange={setShowManageTripDialog}
      />
    </>
  );
};
