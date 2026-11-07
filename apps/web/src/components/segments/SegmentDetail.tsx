import type { FC } from 'react';
import { PvPageGrid } from '@pacevault/ui/components/pvPageGrid/PvPageGrid.tsx';
import type { StoredSegmentPass } from '@/lib/workers/segmentsContract.ts';
import type { MatchedSegment } from './types.ts';
import { PassStrip } from './PassStrip.tsx';
import { SegmentChartsExplorer } from './charts/SegmentChartsExplorer.tsx';
import { useSegmentPassSelection } from './hooks/useSegmentPassSelection.ts';
import { useClearExplorerMarkersEffect } from './hooks/useClearExplorerMarkersEffect.ts';

interface SegmentDetailProps {
  segment: MatchedSegment;
  best: StoredSegmentPass;
}

export const SegmentDetail: FC<SegmentDetailProps> = (props) => {
  const passSelection = useSegmentPassSelection(props.segment);
  useClearExplorerMarkersEffect();
  const best = props.best;
  const selected = props.segment.passes.find((pass) => pass.sessionId === passSelection[0]);

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
