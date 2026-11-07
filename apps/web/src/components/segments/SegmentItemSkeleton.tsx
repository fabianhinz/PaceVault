import type { FC } from 'react';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { PvInlineSkeleton } from '@pacevault/ui/components/pvInlineSkeleton/PvInlineSkeleton.tsx';

export const SegmentItemSkeleton: FC = () => (
  <PvCard className="flex-row items-center gap-2">
    <span className="size-10 shrink-0 animate-pulse rounded-lg bg-white/10" />
    <span className="flex flex-1 flex-col gap-2">
      <PvInlineSkeleton className="w-20" />
      <PvInlineSkeleton className="w-32" />
    </span>
  </PvCard>
);
