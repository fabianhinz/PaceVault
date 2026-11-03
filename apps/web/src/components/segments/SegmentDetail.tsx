import type { FC } from 'react';
import { PvPageGrid } from '@pacevault/ui/components/pvPageGrid/PvPageGrid.tsx';
import { GLASS_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
import type { Sport } from '@pacevault/engine/types.ts';
import { useRouterParam } from '@/routing/useRouterParam.ts';
import type { Segment } from '@/lib/workers/segmentsContract.ts';
import { SegmentHeader } from './SegmentHeader.tsx';
import { SegmentPeek } from './SegmentPeek.tsx';
import { PassTimesRow } from './PassTimesRow.tsx';
import { bestPassOf } from './segmentPasses.ts';
import { SegmentChartsExplorer } from './charts/SegmentChartsExplorer.tsx';
import { useSegmentPassSelection } from './hooks/useSegmentPassSelection.ts';

const COLOR_BY_SPORT: Record<Sport, string> = {
  running: tokens.sportRunning,
  cycling: tokens.sportCycling,
};

interface SegmentDetailProps {
  segment: Segment;
}

export const SegmentDetail: FC<SegmentDetailProps> = (props) => {
  const passSelection = useSegmentPassSelection(props.segment);
  const from = useRouterParam('from') ?? '';
  const selectedSessionId = passSelection[0];
  const best = bestPassOf(props.segment);
  const selected = props.segment.passes.find((pass) => pass.sessionId === selectedSessionId);
  const sportColor = COLOR_BY_SPORT[props.segment.sport];

  return (
    <div className="space-y-4" data-testid="segment-page">
      <SegmentPeek segment={props.segment} />
      <SegmentHeader segment={props.segment} />
      {best !== undefined && (
        <PvPageGrid>
          <div className={cn(GLASS_CLASS, 'divide-y divide-white/10 overflow-hidden rounded-2xl')}>
            <PassTimesRow
              key={from}
              segment={props.segment}
              best={best}
              selectedSessionId={selectedSessionId}
              sportColor={sportColor}
              onSelect={passSelection[1]}
            />
          </div>
          {selected !== undefined && (
            <SegmentChartsExplorer
              segment={props.segment}
              selected={selected}
              best={best}
              sportColor={sportColor}
            />
          )}
        </PvPageGrid>
      )}
    </div>
  );
};
