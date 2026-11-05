import { useSessionRecordSlices } from '@/queries/sessions/useSessionRecordSlices.ts';
import type { StoredSegmentPass } from '@/lib/workers/segmentsContract.ts';
import type { MatchedSegment } from '@/components/segments/types.ts';
import { passSeries, type PassSeries } from '@/components/segments/charts/segmentChartRows.ts';

export interface SegmentChartSeries {
  selectedPass: StoredSegmentPass | undefined;
  selected: PassSeries | undefined;
  best: PassSeries | undefined;
  loading: boolean;
}

export const useSegmentChartRows = ({
  segment,
  selected,
  best,
}: {
  segment: MatchedSegment;
  selected: StoredSegmentPass | undefined;
  best: StoredSegmentPass | undefined;
}): SegmentChartSeries => {
  const running = segment.sport === 'running';
  const passBySessionId = new Map(segment.passes.map((pass) => [pass.sessionId, pass]));
  const slices = useSessionRecordSlices({
    scope: `segment:${segment.id}`,
    sessionIds: segment.passes.map((pass) => pass.sessionId),
    slice: (input) => {
      const pass = passBySessionId.get(input.sessionId);
      if (pass === undefined) return null;
      return passSeries({ records: input.records, pass, running });
    },
  });
  const paired =
    best !== undefined && selected !== undefined && best.sessionId !== selected.sessionId;
  const selectedSeries = slices.sliceBySessionId.get(selected?.sessionId ?? '') ?? undefined;
  let bestSeries: PassSeries | undefined = undefined;
  if (paired) bestSeries = slices.sliceBySessionId.get(best.sessionId) ?? undefined;
  const complete = selectedSeries !== undefined && (!paired || bestSeries !== undefined);
  if (slices.loading || !complete) {
    return { selectedPass: undefined, selected: undefined, best: undefined, loading: true };
  }
  return { selectedPass: selected, selected: selectedSeries, best: bestSeries, loading: false };
};
