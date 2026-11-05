import type { FC } from 'react';
import { PvPageGrid } from '@pacevault/ui/components/pvPageGrid/PvPageGrid.tsx';
import { GLASS_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { MatchedSegment } from './types.ts';
import { bestPassOf } from './segmentPasses.ts';
import { PassStrip } from './PassStrip.tsx';
import { SegmentChartsExplorer } from './charts/SegmentChartsExplorer.tsx';
import { SegmentPassesNote } from './SegmentPassesNote.tsx';
import { useSegmentPassSelection } from './hooks/useSegmentPassSelection.ts';
import { useClearPassFocusEffect } from './hooks/useClearPassFocusEffect.ts';

interface SegmentDetailProps {
  segment: MatchedSegment;
}

export const SegmentDetail: FC<SegmentDetailProps> = (props) => {
  const passSelection = useSegmentPassSelection(props.segment);
  useClearPassFocusEffect();
  const best = bestPassOf(props.segment);
  const selected = props.segment.passes.find((pass) => pass.sessionId === passSelection[0]);

  if (best === undefined) {
    return (
      <div className={cn(GLASS_CLASS, 'rounded-2xl p-4')}>
        <SegmentPassesNote />
      </div>
    );
  }

  return (
    <PvPageGrid>
      <PassStrip
        segment={props.segment}
        best={best}
        selected={selected ?? best}
        onSelect={passSelection[1]}
      />
      <SegmentChartsExplorer segment={props.segment} selected={selected ?? best} best={best} />
    </PvPageGrid>
  );
};
