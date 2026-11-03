import { useMemo, useState } from 'react';
import { useSessionRecords } from '@/queries/sessions/useSessionRecords.ts';
import type { Segment, StoredSegmentPass } from '@/lib/workers/segmentsContract.ts';
import { passSeries, type PassSeries } from '@/components/segments/charts/segmentChartRows.ts';

export interface SegmentChartSeries {
  selectedPass: StoredSegmentPass | undefined;
  selected: PassSeries | undefined;
  best: PassSeries | undefined;
  loading: boolean;
}

interface ReadySeries {
  selectedPass: StoredSegmentPass;
  selected: PassSeries;
  best: PassSeries | undefined;
}

const usePassSeries = ({
  pass,
  enabled,
  running,
}: {
  pass: StoredSegmentPass | undefined;
  enabled: boolean;
  running: boolean;
}): PassSeries | undefined => {
  const records = useSessionRecords({ sessionId: pass?.sessionId ?? '', enabled }).data;
  return useMemo(() => {
    if (!enabled || pass === undefined || records === undefined) return undefined;
    return passSeries({ records, pass, running });
  }, [enabled, pass, records, running]);
};

export const useSegmentChartRows = ({
  segment,
  selected,
  best,
}: {
  segment: Segment;
  selected: StoredSegmentPass | undefined;
  best: StoredSegmentPass | undefined;
}): SegmentChartSeries => {
  const running = segment.sport === 'running';
  const paired =
    best !== undefined && selected !== undefined && best.sessionId !== selected.sessionId;
  const selectedSeries = usePassSeries({
    pass: selected,
    enabled: selected !== undefined,
    running,
  });
  const bestSeries = usePassSeries({ pass: best, enabled: paired, running });
  const [shown, setShown] = useState<ReadySeries | null>(null);
  const complete =
    selected !== undefined && selectedSeries !== undefined && (!paired || bestSeries !== undefined);

  if (complete && (shown?.selected !== selectedSeries || shown.best !== bestSeries)) {
    setShown({ selectedPass: selected, selected: selectedSeries, best: bestSeries });
  }
  if (complete) {
    return { selectedPass: selected, selected: selectedSeries, best: bestSeries, loading: false };
  }
  if (shown !== null) return { ...shown, loading: false };
  return { selectedPass: undefined, selected: undefined, best: undefined, loading: true };
};
