import type { ElementType, FC, ReactNode } from 'react';
import { SplinePointer } from 'lucide-react';
import { PvInlineSkeleton } from '@pacevault/ui/components/pvInlineSkeleton/PvInlineSkeleton.tsx';
import { PvIconTile } from '@pacevault/ui/components/pvIconTile/PvIconTile.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import type { TypographyVariants } from '@pacevault/ui/components/pvTypography/types.ts';
import type { Segment } from '@/store/segments.ts';
import { TEXT_CLASS_BY_SPORT } from '@/components/dashboard/statusColors.ts';
import type { MatchedSegment } from './types.ts';
import { useSegmentTitle } from './hooks/useSegmentTitle.ts';

interface SegmentHeaderProps {
  segment: Segment | MatchedSegment;
  titleVariant: TypographyVariants;
  titleAs?: ElementType;
  subtitleLoading?: boolean;
  children?: ReactNode;
}

export const SegmentHeader: FC<SegmentHeaderProps> = (props) => {
  const segmentTitle = useSegmentTitle(props.segment);

  return (
    <div className="flex items-center justify-between gap-3" data-testid="segment-header">
      <div className="flex min-w-0 items-center gap-2">
        <PvIconTile icon={SplinePointer} className={TEXT_CLASS_BY_SPORT[props.segment.sport]} />
        <div className="min-w-0">
          <PvTypography variant={props.titleVariant} as={props.titleAs} className="truncate">
            {segmentTitle.title}
          </PvTypography>
          {props.subtitleLoading === true && (
            <span className="flex h-4 items-center">
              <PvInlineSkeleton className="h-2.5 w-40" />
            </span>
          )}
          {props.subtitleLoading !== true && (
            <PvTypography variant="caption" as="p" tabularNums className="truncate">
              {segmentTitle.subtitle}
            </PvTypography>
          )}
        </div>
      </div>
      {props.children}
    </div>
  );
};
