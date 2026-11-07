import { useMemo, type FC } from 'react';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { SessionRecord } from '@pacevault/engine/types.ts';
import { usePageRouting } from '@/routing/usePageRouting.ts';
import { recordSpanBetween } from '@/lib/analysis/laps.ts';
import type { StoredSegmentPass } from '@/lib/workers/segmentsContract.ts';
import { useMapHover } from '@/components/mapBackground/hooks/useMapHover.ts';
import type { MapHoverTarget } from '@/store/mapFocus.ts';
import type { MatchedSegment } from '@/components/segments/types.ts';
import { BestHighlight } from '@/components/segments/BestHighlight.tsx';
import { SegmentCompactItem } from '@/components/segments/SegmentCompactItem.tsx';

interface SessionSegmentItemProps {
  segment: MatchedSegment;
  sessionId: string;
  best: boolean;
  value: string;
  pass: StoredSegmentPass;
  records: SessionRecord[];
}

export const SessionSegmentItem: FC<SessionSegmentItemProps> = (props) => {
  const pageRouting = usePageRouting();
  const span = useMemo(
    () =>
      recordSpanBetween({
        records: props.records,
        startSec: props.pass.startTimestampSec,
        endSec: props.pass.endTimestampSec,
      }),
    [props.records, props.pass],
  );
  let hoverTarget: MapHoverTarget | null = null;
  if (span !== null) hoverTarget = { kind: 'segmentSpan', id: props.segment.id, span };
  const segmentHover = useMapHover(hoverTarget);

  return (
    <SegmentCompactItem
      testId="segment-item"
      segment={props.segment}
      onClick={() =>
        pageRouting.open({
          page: 'segmentDetail',
          params: { segmentId: props.segment.id, from: props.sessionId },
        })
      }
      onPointerEnter={segmentHover.onPointerEnter}
      onPointerLeave={segmentHover.onPointerLeave}
      className={cn(props.best && 'border-best/20')}
      decoration={props.best && <BestHighlight size="sm" />}
      value={props.value}
    />
  );
};
