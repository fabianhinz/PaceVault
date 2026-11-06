import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { GLASS_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { passCountLabel } from '@/microcopy/segments.ts';

export const SegmentPassesNote: FC = () => (
  <div className={cn(GLASS_CLASS, 'flex flex-col gap-1 rounded-2xl p-4')}>
    <PvTypography variant="subtitle1">{passCountLabel(0)}</PvTypography>
    <PvTypography variant="caption" as="p" color="textSecondary">
      {m.ui_segment_imports_checked()}
    </PvTypography>
  </div>
);
