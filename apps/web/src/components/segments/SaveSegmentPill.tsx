import { useState, type FC } from 'react';
import { SplinePointer } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvFloatingPill } from '@pacevault/ui/components/pvFloatingPill/PvFloatingPill.tsx';
import type { SessionRecord, TrainingSession } from '@pacevault/engine/types.ts';
import type { Segment } from '@/store/segments.ts';
import { useSessionGps } from '@/queries/sessions/useSessionGps.ts';
import { recordSpanOfMinutes } from '@/components/sessions/charts/railRange.ts';
import { segmentDraft } from './segmentCreation.ts';
import { CreateSegmentDialog } from './CreateSegmentDialog.tsx';
import { useSaveSegment } from './hooks/useSaveSegment.ts';

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
      <CreateSegmentDialog
        draft={draft}
        title={m.ui_segment_save_as()}
        onClose={() => setDraft(null)}
      />
    </>
  );
};
