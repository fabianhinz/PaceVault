import { useState, type FC } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvActionsMenu } from '@pacevault/ui/components/pvActionsMenu/PvActionsMenu.tsx';
import { useSegmentsStore, type Segment } from '@/store/segments.ts';
import { SegmentNameDialog } from './SegmentNameDialog.tsx';
import { DeleteSegmentDialog } from './DeleteSegmentDialog.tsx';

interface SegmentActionsMenuProps {
  segment: Segment;
}

export const SegmentActionsMenu: FC<SegmentActionsMenuProps> = (props) => {
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <PvActionsMenu
        closeLabel={m.ui_sheet_drag_close()}
        label={m.ui_segment_actions()}
        items={[
          {
            id: 'rename',
            icon: Pencil,
            label: m.ui_btn_rename(),
            onSelect: () => setShowRenameDialog(true),
          },
          {
            id: 'delete',
            icon: Trash2,
            label: m.ui_btn_delete(),
            danger: true,
            onSelect: () => setShowDeleteDialog(true),
          },
        ]}
      />

      <SegmentNameDialog
        open={showRenameDialog}
        onOpenChange={setShowRenameDialog}
        mode="rename"
        title={m.ui_segment_rename_title()}
        initialName={props.segment.name}
        facts={undefined}
        similarSegment={undefined}
        onSubmit={(name) => {
          useSegmentsStore.getState().renameSegment({ id: props.segment.id, name });
          setShowRenameDialog(false);
        }}
      />

      <DeleteSegmentDialog
        segment={props.segment}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </>
  );
};
