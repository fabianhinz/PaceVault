import type { FC } from 'react';
import { PvActionItemList } from '@pacevault/ui/components/pvActionItem/PvActionItemList.tsx';
import { VirtualItemList } from '@/components/layout/VirtualItemList.tsx';
import { SegmentItem } from './SegmentItem.tsx';
import { SegmentItemSkeleton } from './SegmentItemSkeleton.tsx';
import { SegmentsEmpty } from './SegmentsEmpty.tsx';
import { useFilteredSegments } from './hooks/useFilteredSegments.ts';

const SKELETON_ITEMS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const ESTIMATED_ROW_SIZE = 82;

export const SegmentsTab: FC = () => {
  const segments = useFilteredSegments();

  return (
    <div className="flex flex-col gap-2" data-testid="segments-tab">
      {segments === undefined && (
        <PvActionItemList>
          {SKELETON_ITEMS.map((key) => (
            <SegmentItemSkeleton key={key} />
          ))}
        </PvActionItemList>
      )}
      {segments !== undefined && segments.length === 0 && <SegmentsEmpty />}
      {segments !== undefined && (
        <VirtualItemList
          items={segments}
          estimatedRowSize={ESTIMATED_ROW_SIZE}
          itemKey={(segment) => segment.id}
          renderItem={(segment) => <SegmentItem segment={segment} />}
        />
      )}
    </div>
  );
};
