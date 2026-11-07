import type { FC } from 'react';
import type { Segment } from '@/store/segments.ts';
import { SegmentNameDialog } from '@/components/segments/SegmentNameDialog.tsx';
import { useSaveSegment } from '@/components/segments/hooks/useSaveSegment.ts';
import { useSimilarSegment } from '@/components/segments/hooks/useSimilarSegment.ts';

interface CreateSegmentDialogProps {
  draft: Segment | null;
  title: string;
  onClose: () => void;
}

export const CreateSegmentDialog: FC<CreateSegmentDialogProps> = (props) => {
  const saveSegment = useSaveSegment();
  const similarSegment = useSimilarSegment(props.draft);
  const draft = props.draft;

  return (
    <SegmentNameDialog
      open={draft !== null}
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
      mode="create"
      title={props.title}
      initialName={draft?.name ?? ''}
      similarSegment={similarSegment}
      onSubmit={(name) => {
        if (draft === null) return;
        props.onClose();
        saveSegment.save({ ...draft, name });
      }}
    />
  );
};
