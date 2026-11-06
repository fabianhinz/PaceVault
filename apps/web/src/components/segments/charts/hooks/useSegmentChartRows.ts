import { useState } from 'react';
import { useSessionRecordSlices } from '@/queries/sessions/useSessionRecordSlices.ts';
import type { StoredSegmentPass } from '@/lib/workers/segmentsContract.ts';
import type { MatchedSegment } from '@/components/segments/types.ts';
import { passSeries, type PassSeries } from '@/components/segments/charts/segmentChartRows.ts';

interface SegmentChartSeries {
  selectedPass: StoredSegmentPass | undefined;
  selected: PassSeries | undefined;
  best: PassSeries | undefined;
  loading: boolean;
}

const LOADING_SERIES: SegmentChartSeries = {
  selectedPass: undefined,
  selected: undefined,
  best: undefined,
  loading: true,
};

const loadedSeries = ({
  passSeriesBySessionId,
  selected,
  best,
}: {
  passSeriesBySessionId: Map<string, PassSeries | null>;
  selected: StoredSegmentPass;
  best: StoredSegmentPass;
}): SegmentChartSeries | undefined => {
  const selectedSeries = passSeriesBySessionId.get(selected.sessionId);
  if (selectedSeries === undefined || selectedSeries === null) return undefined;
  if (best.sessionId === selected.sessionId) {
    return { selectedPass: selected, selected: selectedSeries, best: undefined, loading: false };
  }
  const bestSeries = passSeriesBySessionId.get(best.sessionId);
  if (bestSeries === undefined || bestSeries === null) return undefined;
  return { selectedPass: selected, selected: selectedSeries, best: bestSeries, loading: false };
};

export const useSegmentChartRows = ({
  segment,
  selected,
  best,
}: {
  segment: MatchedSegment;
  selected: StoredSegmentPass;
  best: StoredSegmentPass;
}): SegmentChartSeries => {
  const running = segment.sport === 'running';
  const shownPasses = [selected, best];
  const passSeriesBySessionId = useSessionRecordSlices({
    scope: `segment:${segment.id}`,
    sessionIds: [...new Set(shownPasses.map((pass) => pass.sessionId))],
    slice: (input) => {
      const pass = shownPasses.find((candidate) => candidate.sessionId === input.sessionId);
      if (pass === undefined) return null;
      return passSeries({ records: input.records, pass, running });
    },
  });
  const loaded = loadedSeries({ passSeriesBySessionId, selected, best });
  const [lastLoaded, setLastLoaded] = useState<SegmentChartSeries | undefined>(undefined);
  if (
    loaded !== undefined &&
    (loaded.selected !== lastLoaded?.selected || loaded.best !== lastLoaded?.best)
  ) {
    setLastLoaded(loaded);
  }
  return loaded ?? lastLoaded ?? LOADING_SERIES;
};
