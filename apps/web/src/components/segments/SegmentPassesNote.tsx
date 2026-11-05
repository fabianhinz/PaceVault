import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { passCountLabel } from '@/microcopy/segments.ts';

export const SegmentPassesNote: FC = () => (
  <div className="flex flex-col gap-1" data-testid="segment-passes-note">
    <PvTypography variant="subtitle1">{passCountLabel(0)}</PvTypography>
    <PvTypography variant="caption" as="p" color="textSecondary">
      {m.ui_segment_imports_checked()}
    </PvTypography>
  </div>
);
