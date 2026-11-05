import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { PvPageGrid } from '@pacevault/ui/components/pvPageGrid/PvPageGrid.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { useRouterParam } from '@/routing/useRouterParam.ts';
import { SegmentDetail } from './SegmentDetail.tsx';
import { SegmentHeader } from './SegmentHeader.tsx';
import { SegmentPeek } from './SegmentPeek.tsx';
import { SegmentActionsMenu } from './SegmentActionsMenu.tsx';
import { SegmentPassesNote } from './SegmentPassesNote.tsx';
import { PassStripSkeleton } from './PassStripSkeleton.tsx';
import { SegmentExplorerFrame } from './charts/SegmentExplorerFrame.tsx';
import { useSegmentDetail } from './hooks/useSegmentDetail.ts';

export const Segments: FC = () => {
  const id = useRouterParam('id');
  const segmentDetail = useSegmentDetail(id);
  const segment = segmentDetail.segment;
  const matched = segmentDetail.matched;

  if (segment === undefined) {
    return (
      <PvTypography variant="body1" color="textSecondary">
        {m.ui_segment_not_found()}
      </PvTypography>
    );
  }
  const loading = matched === undefined && segmentDetail.finding;
  return (
    <div className="space-y-4" data-testid="segment-page">
      <SegmentPeek segment={matched ?? segment} />
      <SegmentHeader
        segment={matched ?? segment}
        titleVariant="h2"
        titleAs="h1"
        subtitleLoading={loading}
      >
        <SegmentActionsMenu segment={segment} />
      </SegmentHeader>
      {matched !== undefined && <SegmentDetail key={segment.id} segment={matched} />}
      {loading && (
        <PvPageGrid>
          <PassStripSkeleton />
          <SegmentExplorerFrame sport={segment.sport} />
        </PvPageGrid>
      )}
      {matched === undefined && !segmentDetail.finding && <SegmentPassesNote />}
    </div>
  );
};
