import type { FC } from 'react';
import { PvActionItem } from '@pacevault/ui/components/pvActionItem/PvActionItem.tsx';
import { PvIconTile } from '@pacevault/ui/components/pvIconTile/PvIconTile.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { usePageRouting } from '@/routing/usePageRouting.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import type { StoredSegmentPass } from '@/lib/workers/segmentsContract.ts';
import type { MatchedSegment } from '@/components/segments/types.ts';
import { formatDate, formatRaceTime, formatSignedRaceTime } from '@/lib/format/formatters.ts';
import { formatSessionName } from '@/components/sessions/sessionTitleFormatter.ts';
import { ICON_BY_SPORT } from '@/components/sessions/sportIcons.ts';
import { TEXT_CLASS_BY_SPORT } from '@/components/dashboard/statusColors.ts';
import { BestHighlight } from './BestHighlight.tsx';

interface PassItemProps {
  segment: MatchedSegment;
  pass: StoredSegmentPass;
  best: StoredSegmentPass;
}

export const PassItem: FC<PassItemProps> = (props) => {
  const pageRouting = usePageRouting();
  const session = useSessionsStore((s) =>
    s.sessions.find((candidate) => candidate.id === props.pass.sessionId),
  );
  const isBest = props.pass.sessionId === props.best.sessionId;
  const date = formatDate(props.pass.date);
  let title = date;
  if (session !== undefined) title = formatSessionName(session);
  let value = formatSignedRaceTime(props.pass.movingSec - props.best.movingSec);
  let valueCaption: string | undefined = formatRaceTime(props.pass.movingSec);
  if (isBest) {
    value = formatRaceTime(props.pass.movingSec);
    valueCaption = undefined;
  }

  return (
    <PvActionItem
      testId="selected-pass-item"
      radius="lg"
      label={`${title} · ${date}`}
      onClick={() =>
        pageRouting.open({ page: 'sessionDetail', params: { sessionId: props.pass.sessionId } })
      }
      className={cn(isBest && 'border-best/20')}
      decoration={isBest && <BestHighlight />}
      avatar={
        <PvIconTile
          icon={ICON_BY_SPORT[props.segment.sport]}
          className={TEXT_CLASS_BY_SPORT[props.segment.sport]}
        />
      }
      primary={title}
      secondary={date}
      value={value}
      valueCaption={valueCaption}
    />
  );
};
