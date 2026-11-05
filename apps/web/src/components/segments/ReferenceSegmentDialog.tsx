import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import type { Segment } from '@/store/segments.ts';
import { SegmentNameDialog } from '@/components/segments/SegmentNameDialog.tsx';
import { segmentFactsLine } from '@/components/segments/segmentFacts.ts';
import { useSaveSegment } from '@/components/segments/hooks/useSaveSegment.ts';
import { useSimilarSegment } from '@/components/segments/hooks/useSimilarSegment.ts';

interface ReferenceSegmentDialogProps {
  draft: Segment | null;
  onClose: () => void;
}

export const ReferenceSegmentDialog: FC<ReferenceSegmentDialogProps> = (props) => {
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
      title={m.ui_segment_use_as_reference()}
      initialName={draft?.name ?? ''}
      facts={draft === null ? undefined : segmentFactsLine(draft)}
      similarSegment={similarSegment}
      onSubmit={(name) => {
        if (draft === null) return;
        props.onClose();
        saveSegment.save({ ...draft, name });
      }}
    />
  );
};
