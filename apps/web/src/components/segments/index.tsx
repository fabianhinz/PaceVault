import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { useRouterParam } from '@/routing/useRouterParam.ts';
import { SegmentDetail } from './SegmentDetail.tsx';
import { SegmentDetailSkeleton } from './SegmentDetailSkeleton.tsx';
import { useSegments } from './hooks/useSegments.ts';

export const Segments: FC = () => {
  const id = useRouterParam('id');
  const segments = useSegments().segments;

  if (segments === undefined) return <SegmentDetailSkeleton />;
  const segment = segments.find((candidate) => candidate.id === id);
  if (segment === undefined) {
    return (
      <PvTypography variant="body1" color="textSecondary">
        {m.ui_segment_not_found()}
      </PvTypography>
    );
  }
  return <SegmentDetail key={segment.id} segment={segment} />;
};
