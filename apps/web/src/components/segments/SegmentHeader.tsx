import type { FC } from 'react';
import { PvIconTile } from '@pacevault/ui/components/pvIconTile/PvIconTile.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import type { Segment } from '@/lib/workers/segmentsContract.ts';
import { LABEL_BY_SPORT } from '@/microcopy/sports.ts';
import { segmentLabel } from '@/microcopy/segments.ts';
import { ICON_BY_SEGMENT_TYPE } from './segmentTypeIcons.ts';
import { segmentFacts } from './segmentFacts.ts';

interface SegmentHeaderProps {
  segment: Segment;
}

export const SegmentHeader: FC<SegmentHeaderProps> = (props) => (
  <div className="flex min-w-0 flex-1 items-center gap-2" data-testid="segment-header">
    <PvIconTile icon={ICON_BY_SEGMENT_TYPE[props.segment.type]} />
    <div className="min-w-0">
      <PvTypography variant="h2" as="h1" noWrap>
        {segmentLabel(props.segment)}
      </PvTypography>
      <PvTypography variant="caption" as="p" color="textSecondary" tabularNums>
        {[LABEL_BY_SPORT[props.segment.sport](), ...segmentFacts(props.segment)].join(' · ')}
      </PvTypography>
    </div>
  </div>
);
