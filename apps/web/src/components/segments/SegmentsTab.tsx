import type { FC } from 'react';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { useSegmentFocusStore } from '@/store/segmentFocus.ts';
import { formatShortDate } from '@/lib/format/formatters.ts';
import { VirtualItemList } from '@/components/layout/VirtualItemList.tsx';
import { SegmentItem } from './SegmentItem.tsx';
import { SegmentsUpdatingNote } from './SegmentsUpdatingNote.tsx';
import { SegmentItemSkeleton } from './SegmentItemSkeleton.tsx';
import { SegmentsEmpty } from './SegmentsEmpty.tsx';
import { useFilteredSegments } from './hooks/useFilteredSegments.ts';

const SKELETON_ITEMS = [0, 1, 2, 3, 4];
const ESTIMATED_ROW_SIZE = 82;

export const SegmentsTab: FC = () => {
  const segmentsState = useFilteredSegments();
  const pointerFine = useDevice().pointerFine;
  const segments = segmentsState.segments;

  return (
    <div className="flex flex-col gap-2" data-testid="segments-tab">
      {segmentsState.updating && <SegmentsUpdatingNote />}
      {segments === undefined && SKELETON_ITEMS.map((key) => <SegmentItemSkeleton key={key} />)}
      {segments !== undefined && segments.length === 0 && <SegmentsEmpty />}
      {segments !== undefined && (
        <VirtualItemList
          items={segments}
          estimatedRowSize={ESTIMATED_ROW_SIZE}
          itemKey={(segment) => segment.id}
          renderItem={(segment) => (
            <SegmentItem
              segment={segment}
              value={formatShortDate({ value: segment.lastPassDate, now: Date.now() })}
              openTarget={{ page: 'segmentDetail', params: { segmentId: segment.id } }}
              onHoverChange={(hovered) => {
                if (!pointerFine) return;
                let hoveredId: string | null = null;
                if (hovered) hoveredId = segment.id;
                useSegmentFocusStore.getState().setHoveredSegment(hoveredId);
              }}
            />
          )}
        />
      )}
    </div>
  );
};
