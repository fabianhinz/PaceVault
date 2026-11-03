import type { FC } from 'react';
import { Spline } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvCollapsibleListItem } from '@pacevault/ui/components/pvCollapsibleListItem/PvCollapsibleListItem.tsx';
import type { SessionRecord, TrainingSession } from '@pacevault/engine/types.ts';
import { segmentCountLabel } from '@/microcopy/segments.ts';
import { useSessionSegments } from '@/components/segments/hooks/useSessionSegments.ts';
import type { SessionSegment } from '@/components/segments/segmentPasses.ts';
import { SessionSegmentList } from './SessionSegmentList.tsx';

interface SegmentsRowProps {
  session: TrainingSession;
  records: SessionRecord[];
}

const bestOnLabel = (sessionSegments: SessionSegment[]): string | undefined => {
  const bestCount = sessionSegments.filter((entry) => entry.rank === 1).length;
  if (bestCount === 0) return undefined;
  return m.ui_segments_best_on({ count: String(bestCount) });
};

export const SegmentsRow: FC<SegmentsRowProps> = (props) => {
  const sessionSegments = useSessionSegments(props.session.id);

  if (sessionSegments === undefined) {
    return <div data-testid="segments-row-skeleton" className="h-52px animate-pulse bg-white/5" />;
  }

  const count = sessionSegments.length;
  let primary = segmentCountLabel(count);
  if (count === 0) primary = m.ui_segments_none();

  return (
    <PvCollapsibleListItem
      testId="segments-row"
      disabled={count === 0}
      avatar={<Spline size={20} aria-hidden className="shrink-0 text-text-secondary" />}
      primary={primary}
      secondary={bestOnLabel(sessionSegments)}
    >
      <SessionSegmentList
        sessionId={props.session.id}
        records={props.records}
        sessionSegments={sessionSegments}
      />
    </PvCollapsibleListItem>
  );
};
