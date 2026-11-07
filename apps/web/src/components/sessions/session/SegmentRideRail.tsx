import type { FC, ReactNode } from 'react';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { PvActionItemList } from '@pacevault/ui/components/pvActionItem/PvActionItemList.tsx';

type RailEdge = 'start' | 'end';

interface SegmentRideRailProps {
  startLabel: string;
  endLabel: string;
  children: ReactNode;
}

const MARKER_CLASS_BY_EDGE: Record<RailEdge, string> = {
  start: 'border-2 border-white/30',
  end: 'bg-white/30',
};

const endpoint = ({ edge, label }: { edge: RailEdge; label: string }): ReactNode => (
  <div className="flex items-center gap-3" data-testid={`segment-ride-rail-${edge}`}>
    <span className="flex w-3 shrink-0 justify-center">
      <span aria-hidden className={cn('size-2.5 rounded-full', MARKER_CLASS_BY_EDGE[edge])} />
    </span>
    <PvTypography variant="overline" color="textTertiary" noWrap>
      {label}
    </PvTypography>
  </div>
);

export const SegmentRideRail: FC<SegmentRideRailProps> = (props) => (
  <div className="flex flex-col" data-testid="segment-ride-rail">
    {endpoint({ edge: 'start', label: props.startLabel })}
    <div className="flex gap-3">
      <span className="flex w-3 shrink-0 justify-center">
        <span aria-hidden className="w-0.5 bg-white/10" />
      </span>
      <PvActionItemList size="sm" className="min-w-0 flex-1 py-2">
        {props.children}
      </PvActionItemList>
    </div>
    {endpoint({ edge: 'end', label: props.endLabel })}
  </div>
);
