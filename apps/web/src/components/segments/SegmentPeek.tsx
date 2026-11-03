import type { FC } from 'react';
import { PvIconTile } from '@pacevault/ui/components/pvIconTile/PvIconTile.tsx';
import { PvSheetPeek } from '@pacevault/ui/components/pvBottomSheet/PvSheetPeek.tsx';
import type { Segment } from '@/lib/workers/segmentsContract.ts';
import { passCountLabel, segmentLabel } from '@/microcopy/segments.ts';
import { ICON_BY_SEGMENT_TYPE } from './segmentTypeIcons.ts';
import { segmentFacts } from './segmentFacts.ts';

interface SegmentPeekProps {
  segment: Segment;
}

export const SegmentPeek: FC<SegmentPeekProps> = (props) => (
  <PvSheetPeek
    icon={<PvIconTile icon={ICON_BY_SEGMENT_TYPE[props.segment.type]} />}
    primary={segmentLabel(props.segment)}
    secondary={[...segmentFacts(props.segment), passCountLabel(props.segment.passes.length)].join(
      ' · ',
    )}
  />
);
