import { useState, type FC } from 'react';
import { SplinePointer } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvFloatingPill } from '@pacevault/ui/components/pvFloatingPill/PvFloatingPill.tsx';
import type { SessionRecord, TrainingSession } from '@pacevault/engine/types.ts';
import type { Segment } from '@/store/segments.ts';
import { useSessionGps } from '@/queries/sessions/useSessionGps.ts';
import { recordSpanOfMinutes } from '@/components/sessions/charts/railRange.ts';
import { segmentDraft } from './segmentCreation.ts';
import { segmentFactsLine } from './segmentFacts.ts';
import { SegmentNameDialog } from './SegmentNameDialog.tsx';
import { useSaveSegment } from './hooks/useSaveSegment.ts';
import { useSimilarSegment } from './hooks/useSimilarSegment.ts';

interface SaveSegmentPillProps {
  session: TrainingSession;
  records: SessionRecord[];
  zoomRange: { from: number; to: number } | null;
}

const draftOf = (props: SaveSegmentPillProps): Segment | null => {
  if (props.zoomRange === null) return null;
  const span = recordSpanOfMinutes({ records: props.records, range: props.zoomRange });
  if (span === null) return null;
  return segmentDraft({ session: props.session, records: props.records, span, kind: 'range' });
};

export const SaveSegmentPill: FC<SaveSegmentPillProps> = (props) => {
  const [draft, setDraft] = useState<Segment | null>(null);
  const saveSegment = useSaveSegment();
  const similar = useSimilarSegment(draft);
  const sessionGps = useSessionGps({
    sessionId: props.session.id,
    enabled: props.session.hasDetailedRecords,
  });
  if (sessionGps.data === undefined || sessionGps.data === null) return null;

  return (
    <>
      <PvFloatingPill
        onClick={() => {
          const next = draftOf(props);
          if (next === null) {
            saveSegment.save(null);
            return;
          }
          setDraft(next);
        }}
      >
        <SplinePointer size={16} />
        <span>{m.ui_segment_save_as()}</span>
      </PvFloatingPill>
      <SegmentNameDialog
        open={draft !== null}
        onOpenChange={(open) => {
          if (!open) setDraft(null);
        }}
        mode="create"
        title={m.ui_segment_save_as()}
        initialName={draft?.name ?? ''}
        facts={draft === null ? undefined : segmentFactsLine(draft)}
        similarSegment={similar}
        onSubmit={(name) => {
          if (draft === null) return;
          setDraft(null);
          saveSegment.save({ ...draft, name });
        }}
      />
    </>
  );
};
