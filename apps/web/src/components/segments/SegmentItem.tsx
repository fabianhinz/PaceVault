import type { FC } from 'react';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { usePageRouting } from '@/routing/usePageRouting.ts';
import { useMapHover } from '@/components/mapBackground/hooks/useMapHover.ts';
import type { MatchedSegment } from './types.ts';
import { SegmentHeader } from './SegmentHeader.tsx';

interface SegmentItemProps {
  segment: MatchedSegment;
}

export const SegmentItem: FC<SegmentItemProps> = (props) => {
  const pageRouting = usePageRouting();
  const segmentHover = useMapHover({ kind: 'segment', id: props.segment.id });
  const open = () => {
    pageRouting.open({ page: 'segmentDetail', params: { segmentId: props.segment.id } });
  };

  return (
    <PvCard
      data-testid="segment-item"
      role="button"
      tabIndex={0}
      aria-label={props.segment.name}
      className="cursor-pointer hover:bg-white/10"
      onClick={open}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        open();
      }}
      onPointerEnter={segmentHover.onPointerEnter}
      onPointerLeave={segmentHover.onPointerLeave}
    >
      <SegmentHeader segment={props.segment} titleVariant="subtitle1" />
    </PvCard>
  );
};
