import type { FC } from 'react';
import { PvInlineSkeleton } from '@pacevault/ui/components/pvInlineSkeleton/PvInlineSkeleton.tsx';
import { FLOATING_LG_CLASS, GLASS_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';

const SKELETON_CHIP_KEYS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

export const PassStripSkeleton: FC = () => (
  <div
    aria-hidden
    data-testid="pass-strip-skeleton"
    className={cn(
      FLOATING_LG_CLASS,
      'lg:sticky lg:top-6 z-raised flex flex-col gap-3 rounded-3xl p-3',
    )}
  >
    <div className="flex flex-col gap-1 overflow-hidden">
      <PvInlineSkeleton className="h-3 w-8" />
      <div className="flex gap-1">
        {SKELETON_CHIP_KEYS.map((key) => (
          <span
            key={key}
            className="flex size-18 shrink-0 flex-col items-center gap-0.5 rounded-lg border border-white/10 p-2"
          >
            <PvInlineSkeleton className="h-3 w-8" />
            <span className="block h-10" />
          </span>
        ))}
      </div>
    </div>
    <div className={cn(GLASS_CLASS, 'flex items-center gap-2 rounded-lg p-4')}>
      <span className="size-10 shrink-0 animate-pulse rounded-lg bg-white/10" />
      <span className="flex flex-1 flex-col">
        <span className="flex h-5 items-center">
          <PvInlineSkeleton className="w-24" />
        </span>
        <span className="flex h-4 items-center">
          <PvInlineSkeleton className="h-2.5 w-16" />
        </span>
      </span>
    </div>
  </div>
);
