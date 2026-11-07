import type { FC } from 'react';
import { SplinePointer } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';

export const SegmentsEmpty: FC = () => (
  <PvCard className="flex-row items-center gap-3">
    <SplinePointer size={18} className="shrink-0 text-primary" aria-hidden />
    <div className="min-w-0">
      <PvTypography>{m.ui_segments_empty_title()}</PvTypography>
      <PvTypography variant="caption" as="p">
        {m.ui_segments_how_to()}
      </PvTypography>
    </div>
  </PvCard>
);
