import type { FC } from 'react';
import { PvIconTile } from '@pacevault/ui/components/pvIconTile/PvIconTile.tsx';
import {
  PvActionItem,
  type ActionItemSize,
} from '@pacevault/ui/components/pvActionItem/PvActionItem.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { usePageRouting } from '@/routing/usePageRouting.ts';
import type { PageTarget } from '@/routing/pageRegistry.ts';
import type { Segment } from '@/lib/workers/segmentsContract.ts';
import { TEXT_CLASS_BY_SPORT } from '@/components/dashboard/statusColors.ts';
import { passCountLabel, segmentLabel } from '@/microcopy/segments.ts';
import { ICON_BY_SEGMENT_TYPE } from './segmentTypeIcons.ts';
import { segmentFacts } from './segmentFacts.ts';
import { BestHighlight } from './BestHighlight.tsx';

const AVATAR_CLASS_BY_SIZE: Record<ActionItemSize, string> = {
  md: '',
  sm: 'h-7 w-7 rounded-md',
};

interface SegmentItemProps {
  segment: Segment;
  best?: boolean;
  size?: ActionItemSize;
  value: string;
  valueCaption?: string;
  openTarget: PageTarget;
  onOpen?: () => void;
  onHoverChange?: (hovered: boolean) => void;
}

export const SegmentItem: FC<SegmentItemProps> = (props) => {
  const pageRouting = usePageRouting();
  const size = props.size ?? 'md';
  const label = segmentLabel(props.segment);
  let secondary: string | undefined = undefined;
  if (size === 'md') {
    secondary = [...segmentFacts(props.segment), passCountLabel(props.segment.passes.length)].join(
      ' · ',
    );
  }

  return (
    <PvActionItem
      testId="segment-item"
      size={size}
      label={label}
      onClick={() => {
        props.onHoverChange?.(false);
        props.onOpen?.();
        pageRouting.open(props.openTarget);
      }}
      onPointerEnter={() => props.onHoverChange?.(true)}
      onPointerLeave={() => props.onHoverChange?.(false)}
      className={cn(props.best === true && 'border-best/20')}
      decoration={props.best === true && <BestHighlight size={size} />}
      avatar={
        <PvIconTile
          icon={ICON_BY_SEGMENT_TYPE[props.segment.type]}
          className={cn(TEXT_CLASS_BY_SPORT[props.segment.sport], AVATAR_CLASS_BY_SIZE[size])}
        />
      }
      primary={label}
      secondary={secondary}
      value={props.value}
      valueCaption={props.valueCaption}
    />
  );
};
