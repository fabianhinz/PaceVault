import type { FC } from 'react';
import { ChartScatter } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvCollapsibleListItem } from '@pacevault/ui/components/pvCollapsibleListItem/PvCollapsibleListItem.tsx';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
import { useRouterParam } from '@/routing/useRouterParam.ts';
import type { Segment, StoredSegmentPass } from '@/lib/workers/segmentsContract.ts';
import { passCountLabel, showMorePassesLabel } from '@/microcopy/segments.ts';
import { gapSeriesSec, passesFastestFirst } from './segmentPasses.ts';
import { PassItem } from './PassItem.tsx';
import { PassScatter } from './PassScatter.tsx';
import { useScatterWindow } from './hooks/useScatterWindow.ts';
import { useListExpansion } from './hooks/useListExpansion.ts';

interface PassTimesRowProps {
  segment: Segment;
  best: StoredSegmentPass;
  selectedSessionId: string;
  sportColor: string;
  onSelect: (sessionId: string) => void;
}

const lineColorFor = ({
  pass,
  best,
  selectedSessionId,
  sportColor,
}: {
  pass: StoredSegmentPass;
  best: StoredSegmentPass;
  selectedSessionId: string;
  sportColor: string;
}): string => {
  if (pass.sessionId === best.sessionId) return tokens.best;
  if (pass.sessionId === selectedSessionId) return sportColor;
  return tokens.textTertiary;
};

const gapRangeSec = ({
  segment,
  best,
}: {
  segment: Segment;
  best: StoredSegmentPass;
}): [number, number] => {
  const gaps = segment.passes.flatMap((pass) => gapSeriesSec({ pass, best }));
  return [
    gaps.reduce((low, gap) => Math.min(low, gap), 0),
    gaps.reduce((high, gap) => Math.max(high, gap), 0),
  ];
};

export const PassTimesRow: FC<PassTimesRowProps> = (props) => {
  const from = useRouterParam('from');
  const listExpansion = useListExpansion();
  const scatterWindow = useScatterWindow(props.segment);
  const windowIds = scatterWindow.windowSessionIds;
  const kept = new Set([props.best.sessionId]);
  if (props.segment.passes.some((pass) => pass.sessionId === from) && from !== undefined)
    kept.add(from);
  const inWindow = passesFastestFirst(props.segment).filter(
    (pass) => windowIds === null || windowIds.has(pass.sessionId) || kept.has(pass.sessionId),
  );
  const collapsed = inWindow.filter((pass) => kept.has(pass.sessionId));
  const moreCount = inWindow.length - collapsed.length;
  let visible = collapsed;
  if (listExpansion.expanded) visible = inWindow;
  const range = gapRangeSec({ segment: props.segment, best: props.best });
  return (
    <PvCollapsibleListItem
      testId="pass-times-row"
      defaultOpen
      avatar={<ChartScatter size={20} aria-hidden className="shrink-0 text-text-secondary" />}
      primary={m.ui_segment_pass_times()}
      secondary={passCountLabel(props.segment.passes.length)}
    >
      <div className="flex flex-col gap-3">
        <PassScatter
          segment={props.segment}
          best={props.best}
          selectedSessionId={props.selectedSessionId}
          sportColor={props.sportColor}
          onSelect={props.onSelect}
          onVisibleChange={scatterWindow.reportVisible}
        />
        <div className="flex flex-col gap-1 pt-1" data-testid="pass-list">
          {visible.map((pass) => (
            <PassItem
              key={pass.sessionId}
              segment={props.segment}
              pass={pass}
              best={props.best}
              selected={pass.sessionId === props.selectedSessionId}
              gapRangeSec={range}
              lineColor={lineColorFor({
                pass,
                best: props.best,
                selectedSessionId: props.selectedSessionId,
                sportColor: props.sportColor,
              })}
              onSelect={props.onSelect}
            />
          ))}
          {moreCount > 0 && (
            <PvButton
              ref={listExpansion.toggleRef}
              variant="secondary"
              aria-expanded={listExpansion.expanded}
              onClick={listExpansion.toggle}
            >
              {listExpansion.expanded
                ? m.ui_segment_show_fewer_passes()
                : showMorePassesLabel(moreCount)}
            </PvButton>
          )}
        </div>
      </div>
    </PvCollapsibleListItem>
  );
};
