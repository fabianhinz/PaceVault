import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import type { SessionRecord } from '@pacevault/engine/types.ts';
import { formatRaceTime } from '@/lib/format/formatters.ts';
import { showMoreSegmentsLabel } from '@/microcopy/segments.ts';
import type { SessionSegment } from '@/components/segments/segmentPasses.ts';
import { useListExpansion } from '@/components/segments/hooks/useListExpansion.ts';
import { SegmentRideRail } from './SegmentRideRail.tsx';
import { SessionSegmentItem } from './SessionSegmentItem.tsx';

const COLLAPSED_SESSION_SEGMENTS = 5;

interface SessionSegmentListProps {
  sessionId: string;
  records: SessionRecord[];
  sessionSegments: SessionSegment[];
}

export const SessionSegmentList: FC<SessionSegmentListProps> = (props) => {
  const listExpansion = useListExpansion();
  const visible = props.sessionSegments.filter(
    (_, i) => listExpansion.expanded || i < COLLAPSED_SESSION_SEGMENTS,
  );
  const moreCount = props.sessionSegments.length - visible.length;

  return (
    <div className="flex flex-col gap-1 pt-2">
      <SegmentRideRail startLabel={m.ui_segments_ride_start()} endLabel={m.ui_segments_ride_end()}>
        {visible.map((entry) => (
          <SessionSegmentItem
            key={entry.segment.id}
            segment={entry.segment}
            sessionId={props.sessionId}
            best={entry.best}
            value={formatRaceTime(entry.pass.movingSec)}
            pass={entry.pass}
            records={props.records}
          />
        ))}
      </SegmentRideRail>
      {props.sessionSegments.length > COLLAPSED_SESSION_SEGMENTS && (
        <PvButton
          ref={listExpansion.toggleRef}
          variant="secondary"
          aria-expanded={listExpansion.expanded}
          onClick={listExpansion.toggle}
        >
          {listExpansion.expanded ? m.ui_segments_show_fewer() : showMoreSegmentsLabel(moreCount)}
        </PvButton>
      )}
    </div>
  );
};
