import type { FC } from 'react';
import { ChevronRight } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvActionItem } from '@pacevault/ui/components/pvActionItem/PvActionItem.tsx';
import { PvIconTile } from '@pacevault/ui/components/pvIconTile/PvIconTile.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { PageLink } from '@/routing/PageLink.tsx';
import { useSessionsStore } from '@/store/sessions.ts';
import { useSegmentFocusStore } from '@/store/segmentFocus.ts';
import type { Segment, StoredSegmentPass } from '@/lib/workers/segmentsContract.ts';
import { formatRaceTime, formatShortDate, formatSignedRaceTime } from '@/lib/format/formatters.ts';
import { formatSessionName } from '@/components/sessions/sessionTitleFormatter.ts';
import { ICON_BY_SPORT } from '@/components/sessions/sportIcons.ts';
import { TEXT_CLASS_BY_SPORT } from '@/components/dashboard/statusColors.ts';
import { gapSeriesSec, passPositionAt } from './segmentPasses.ts';
import { PassGapSpark } from './PassGapSpark.tsx';
import { BestHighlight } from './BestHighlight.tsx';

interface PassItemProps {
  segment: Segment;
  pass: StoredSegmentPass;
  best: StoredSegmentPass;
  selected: boolean;
  gapRangeSec: [number, number];
  lineColor: string;
  onSelect: (sessionId: string) => void;
}

export const PassItem: FC<PassItemProps> = (props) => {
  const session = useSessionsStore((s) =>
    s.sessions.find((candidate) => candidate.id === props.pass.sessionId),
  );
  const hovered = useSegmentFocusStore((s) => s.hoveredPassSessionId === props.pass.sessionId);
  const isBest = props.pass.sessionId === props.best.sessionId;
  const shortDate = formatShortDate({ value: props.pass.date, now: Date.now() });
  let title = shortDate;
  if (session !== undefined) title = formatSessionName(session);
  let value = formatSignedRaceTime(props.pass.durationSec - props.best.durationSec);
  if (isBest) value = formatRaceTime(props.pass.durationSec);

  return (
    <PvActionItem
      testId="pass-item"
      size="sm"
      label={`${title} · ${shortDate}`}
      selected={props.selected || hovered}
      onClick={() => props.onSelect(props.pass.sessionId)}
      onPointerEnter={() =>
        useSegmentFocusStore.getState().hoverPass({
          sessionId: props.pass.sessionId,
          marker: passPositionAt({
            segment: props.segment,
            pass: props.pass,
            elapsedSec: props.best.durationSec,
          }),
        })
      }
      onPointerLeave={() => useSegmentFocusStore.getState().clearPassFocus()}
      className={cn(isBest && 'border-best/20')}
      decoration={isBest && <BestHighlight size="sm" />}
      avatar={
        <PvIconTile
          icon={ICON_BY_SPORT[props.segment.sport]}
          className={cn(TEXT_CLASS_BY_SPORT[props.segment.sport], 'h-7 w-7 rounded-md')}
        />
      }
      primary={title}
      secondary={shortDate}
      aside={
        <span className="w-14 shrink-0">
          <PassGapSpark
            gapsSec={gapSeriesSec({ pass: props.pass, best: props.best })}
            rangeSec={props.gapRangeSec}
            color={props.lineColor}
          />
        </span>
      }
      value={value}
      trailing={
        <PvButton asChild variant="ghost" size="icon">
          <PageLink
            to={{ page: 'sessionDetail', params: { sessionId: props.pass.sessionId } }}
            aria-label={m.ui_segment_open_session()}
          >
            <ChevronRight className="size-4" aria-hidden />
          </PageLink>
        </PvButton>
      }
    />
  );
};
