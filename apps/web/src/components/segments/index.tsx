import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { PvPageGrid } from '@pacevault/ui/components/pvPageGrid/PvPageGrid.tsx';
import { NotFoundBanner } from '@/components/errors/NotFoundBanner.tsx';
import { useRouterParam } from '@/routing/useRouterParam.ts';
import type { StoredSegmentPass } from '@/lib/workers/segmentsContract.ts';
import { bestPassOf } from './segmentPasses.ts';
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
    return <NotFoundBanner>{m.ui_segment_not_found()}</NotFoundBanner>;
  }
  const loading = matched === undefined && segmentDetail.matching;
  let best: StoredSegmentPass | undefined = undefined;
  if (matched !== undefined) best = bestPassOf(matched);
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
      {matched !== undefined && best !== undefined && (
        <SegmentDetail key={segment.id} segment={matched} best={best} />
      )}
      {loading && (
        <PvPageGrid>
          <PassStripSkeleton />
          <SegmentExplorerFrame sport={segment.sport} />
        </PvPageGrid>
      )}
      {!loading && best === undefined && <SegmentPassesNote />}
    </div>
  );
};
