import { useMemo, type FC } from 'react';
import { SplinePointer } from 'lucide-react';
import { PvIconTile } from '@pacevault/ui/components/pvIconTile/PvIconTile.tsx';
import { PvActionItem } from '@pacevault/ui/components/pvActionItem/PvActionItem.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { SessionRecord } from '@pacevault/engine/types.ts';
import { usePageRouting } from '@/routing/usePageRouting.ts';
import { recordSpanBetween } from '@/lib/analysis/laps.ts';
import type { StoredSegmentPass } from '@/lib/workers/segmentsContract.ts';
import { useMapHover } from '@/components/mapBackground/hooks/useMapHover.ts';
import type { MapHoverTarget } from '@/store/mapFocus.ts';
import { TEXT_CLASS_BY_SPORT } from '@/components/dashboard/statusColors.ts';
import type { MatchedSegment } from '@/components/segments/types.ts';
import { BestHighlight } from '@/components/segments/BestHighlight.tsx';

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
    <PvActionItem
      testId="segment-item"
      size="sm"
      label={props.segment.name}
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
      avatar={
        <PvIconTile
          icon={SplinePointer}
          className={cn(TEXT_CLASS_BY_SPORT[props.segment.sport], 'h-7 w-7 rounded-md')}
        />
      }
      primary={props.segment.name}
      value={props.value}
    />
  );
};
