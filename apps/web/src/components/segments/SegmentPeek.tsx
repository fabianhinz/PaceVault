import type { FC } from 'react';
import { SplinePointer } from 'lucide-react';
import { PvIconTile } from '@pacevault/ui/components/pvIconTile/PvIconTile.tsx';
import { PvSheetPeek } from '@pacevault/ui/components/pvBottomSheet/PvSheetPeek.tsx';
import type { Segment } from '@/store/segments.ts';
import { TEXT_CLASS_BY_SPORT } from '@/components/dashboard/statusColors.ts';
import type { MatchedSegment } from './types.ts';
import { useSegmentTitle } from './hooks/useSegmentTitle.ts';

interface SegmentPeekProps {
  segment: Segment | MatchedSegment;
}

export const SegmentPeek: FC<SegmentPeekProps> = (props) => {
  const segmentTitle = useSegmentTitle(props.segment);
  return (
    <PvSheetPeek
      icon={
        <PvIconTile icon={SplinePointer} className={TEXT_CLASS_BY_SPORT[props.segment.sport]} />
      }
      primary={segmentTitle.title}
      secondary={segmentTitle.subtitle}
    />
  );
};
