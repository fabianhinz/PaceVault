import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';

export const SegmentsUpdatingNote: FC = () => (
  <div className="flex items-center gap-2 px-1" data-testid="segments-updating">
    <span aria-hidden className="size-1.5 shrink-0 animate-pulse rounded-full bg-text-secondary" />
    <PvTypography variant="caption" color="textTertiary" noWrap>
      {m.ui_segments_updating()}
    </PvTypography>
  </div>
);
