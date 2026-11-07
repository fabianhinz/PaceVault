import type { ComponentProps, FC } from 'react';
import { SplinePointer } from 'lucide-react';
import { PvIconTile } from '@pacevault/ui/components/pvIconTile/PvIconTile.tsx';
import { PvActionItem } from '@pacevault/ui/components/pvActionItem/PvActionItem.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { Segment } from '@/store/segments.ts';
import { TEXT_CLASS_BY_SPORT } from '@/components/dashboard/statusColors.ts';

interface SegmentCompactItemProps extends Pick<
  ComponentProps<typeof PvActionItem>,
  'testId' | 'value' | 'onClick' | 'onPointerEnter' | 'onPointerLeave' | 'className' | 'decoration'
> {
  segment: Pick<Segment, 'name' | 'sport'>;
}

export const SegmentCompactItem: FC<SegmentCompactItemProps> = (props) => (
  <PvActionItem
    testId={props.testId}
    size="sm"
    label={props.segment.name}
    onClick={props.onClick}
    onPointerEnter={props.onPointerEnter}
    onPointerLeave={props.onPointerLeave}
    className={props.className}
    decoration={props.decoration}
    avatar={
      <PvIconTile
        icon={SplinePointer}
        className={cn(TEXT_CLASS_BY_SPORT[props.segment.sport], 'h-7 w-7 rounded-md')}
      />
    }
    primary={props.segment.name}
    value={props.value}
  />
);
