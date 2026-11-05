import { useState } from 'react';
import { SplinePointer } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import type { ActionsMenuItem } from '@pacevault/ui/components/pvActionsMenu/types.ts';
import type { TrainingSession } from '@pacevault/engine/types.ts';
import type { Segment } from '@/store/segments.ts';
import { usePageRouting } from '@/routing/usePageRouting.ts';
import { useSaveSegment } from '@/components/segments/hooks/useSaveSegment.ts';
import { useSessionReferenceSegment } from '@/components/segments/hooks/useSessionReferenceSegment.ts';

interface ReferenceSegmentMenuEntry {
  item: ActionsMenuItem | null;
  draft: Segment | null;
  closeDraft: () => void;
}

export const useReferenceSegmentMenuEntry = (
  session: TrainingSession,
): ReferenceSegmentMenuEntry => {
  const pageRouting = usePageRouting();
  const referenceSegment = useSessionReferenceSegment(session);
  const saveSegment = useSaveSegment();
  const [draft, setDraft] = useState<Segment | null>(null);
  const referenceSegmentId = referenceSegment.referenceSegmentId;
  const entry: ReferenceSegmentMenuEntry = { item: null, draft, closeDraft: () => setDraft(null) };

  if (!referenceSegment.available) return entry;
  if (referenceSegmentId !== null) {
    entry.item = {
      id: 'open-segment',
      icon: SplinePointer,
      label: m.ui_segment_open(),
      disabled: false,
      onSelect: () =>
        pageRouting.open({ page: 'segmentDetail', params: { segmentId: referenceSegmentId } }),
    };
    return entry;
  }
  entry.item = {
    id: 'use-as-reference-segment',
    icon: SplinePointer,
    label: m.ui_segment_use_as_reference(),
    disabled: referenceSegment.preparing,
    onSelect: () =>
      void referenceSegment.wholeSessionDraft().then((wholeSessionDraft) => {
        if (wholeSessionDraft === null) saveSegment.save(null);
        setDraft(wholeSessionDraft);
      }),
  };
  return entry;
};
