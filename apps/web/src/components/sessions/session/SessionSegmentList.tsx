import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import type { SessionRecord } from '@pacevault/engine/types.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { recordSpanBetween, type RecordSpan } from '@/lib/analysis/laps.ts';
import { formatRaceTime } from '@/lib/format/formatters.ts';
import { passRankLabel, showMoreSegmentsLabel } from '@/microcopy/segments.ts';
import { SegmentItem } from '@/components/segments/SegmentItem.tsx';
import type { SessionSegment } from '@/components/segments/segmentPasses.ts';
import { useListExpansion } from '@/components/segments/hooks/useListExpansion.ts';

export const COLLAPSED_SESSION_SEGMENTS = 5;

interface SessionSegmentListProps {
  sessionId: string;
  records: SessionRecord[];
  sessionSegments: SessionSegment[];
}

const timeAndRank = (entry: SessionSegment): string =>
  m.ui_segment_time_rank({
    time: formatRaceTime(entry.pass.durationSec),
    rank: passRankLabel({ rank: entry.rank, count: entry.segment.passes.length }),
  });

const hoverSpan = ({ entry, records }: { entry: SessionSegment; records: SessionRecord[] }) =>
  recordSpanBetween({
    records,
    startSec: entry.pass.startTimestampSec,
    endSec: entry.pass.endTimestampSec,
  });

export const SessionSegmentList: FC<SessionSegmentListProps> = (props) => {
  const listExpansion = useListExpansion();
  const pointerFine = useDevice().pointerFine;
  const visible = props.sessionSegments.filter(
    (_, i) => listExpansion.expanded || i < COLLAPSED_SESSION_SEGMENTS,
  );
  const moreCount = props.sessionSegments.length - visible.length;

  return (
    <div className="flex flex-col gap-1 pt-2">
      {visible.map((entry) => (
        <SegmentItem
          key={entry.segment.id}
          size="sm"
          segment={entry.segment}
          best={entry.rank === 1}
          value={timeAndRank(entry)}
          openTarget={{
            page: 'segmentDetail',
            params: { segmentId: entry.segment.id, from: props.sessionId },
          }}
          onHoverChange={(hovered) => {
            if (!pointerFine) return;
            let span: RecordSpan | null = null;
            if (hovered) span = hoverSpan({ entry, records: props.records });
            useMapControlsStore.getState().setHoveredSegmentSpan(span);
          }}
        />
      ))}
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
