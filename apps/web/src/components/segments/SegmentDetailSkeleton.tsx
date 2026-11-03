import type { FC } from 'react';
import { PvInlineSkeleton } from '@pacevault/ui/components/pvInlineSkeleton/PvInlineSkeleton.tsx';
import { PvPageGrid } from '@pacevault/ui/components/pvPageGrid/PvPageGrid.tsx';
import { GLASS_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';

export const SegmentDetailSkeleton: FC = () => (
  <div className="space-y-4" data-testid="segment-detail-skeleton">
    <div className="flex items-center gap-2">
      <span className="size-10 shrink-0 animate-pulse rounded-lg bg-white/10" />
      <span className="flex flex-col gap-2">
        <PvInlineSkeleton className="w-24" />
        <PvInlineSkeleton className="w-40" />
      </span>
    </div>
    <PvPageGrid>
      <div className={cn(GLASS_CLASS, 'h-52px animate-pulse rounded-2xl')} />
      <div className={cn(GLASS_CLASS, 'h-52px animate-pulse rounded-2xl')} />
    </PvPageGrid>
  </div>
);
