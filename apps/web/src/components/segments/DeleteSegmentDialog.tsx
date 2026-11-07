import type { ComponentProps, FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvDialog } from '@pacevault/ui/components/pvDialog/PvDialog.tsx';
import { PvDialogHeader } from '@pacevault/ui/components/pvDialog/PvDialogHeader.tsx';
import { PvDialogBody } from '@pacevault/ui/components/pvDialog/PvDialogBody.tsx';
import { PvDialogFooter } from '@pacevault/ui/components/pvDialog/PvDialogFooter.tsx';
import { PvDialogDescription } from '@pacevault/ui/components/pvDialog/PvDialogDescription.tsx';
import { useSegmentsStore, type Segment } from '@/store/segments.ts';
import { usePageRouting } from '@/routing/usePageRouting.ts';
import { useDeleteSegmentMutation } from '@/mutations/segments/useDeleteSegmentMutation.ts';

interface DeleteSegmentDialogProps extends Required<
  Pick<ComponentProps<typeof PvDialog>, 'open' | 'onOpenChange'>
> {
  segment: Segment;
}

export const DeleteSegmentDialog: FC<DeleteSegmentDialogProps> = (props) => {
  const pageRouting = usePageRouting();
  const deleteSegment = useDeleteSegmentMutation();

  const handleDelete = async () => {
    props.onOpenChange(false);
    useSegmentsStore.getState().removeSegment(props.segment.id);
    pageRouting.open({ page: 'dashboard', params: { tab: 'segments' } });
    await deleteSegment.mutateAsync({ segmentId: props.segment.id });
  };

  return (
    <PvDialog
      open={props.open}
      onOpenChange={() => props.onOpenChange(false)}
      closeLabel={m.ui_sheet_drag_close()}
    >
      <PvDialogHeader title={m.ui_segment_delete_title()} />
      <PvDialogBody>
        <PvDialogDescription>
          {m.ui_segment_delete_desc({ name: props.segment.name })}
        </PvDialogDescription>
      </PvDialogBody>
      <PvDialogFooter>
        <PvButton variant="secondary" onClick={() => props.onOpenChange(false)}>
          {m.ui_btn_cancel()}
        </PvButton>
        <PvButton variant="danger" onClick={() => void handleDelete()}>
          {m.ui_btn_delete()}
        </PvButton>
      </PvDialogFooter>
    </PvDialog>
  );
};
