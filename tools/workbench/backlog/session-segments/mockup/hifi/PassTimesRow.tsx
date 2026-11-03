import { useRef, useState, type FC } from 'react';
import { ChartScatter } from 'lucide-react';
import { PvCollapsibleContent } from '@pacevault/ui/components/pvCollapsibleListItem/PvCollapsibleContent.tsx';
import { PvCollapsibleHeader } from '@pacevault/ui/components/pvCollapsibleHeader/PvCollapsibleHeader.tsx';
import { PvListItemHeader } from '@pacevault/ui/components/pvListItemHeader/PvListItemHeader.tsx';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
import type { Copy, Lang } from './copy.ts';
import { latestWindowIds, passesFastestFirst, type Pass, type Segment } from './data.ts';
import { gapValues } from './GapSpark.tsx';
import { PassItem } from './PassItem.tsx';
import { PassScatter } from './PassScatter.tsx';
import { BEST_PALETTE } from './bestPalette.ts';

const COLLAPSED_PASS_COUNT = 1;

interface PassTimesRowProps {
  segment: Segment;
  best: Pass;
  origin: Pass | undefined;
  selected: Pass;
  open: boolean;
  onToggle: () => void;
  onSelect: (sessionId: string) => void;
  sportColor: string;
  lang: Lang;
  text: Copy;
}

const lineColorFor = ({ pass, best, selected, sportColor }: { pass: Pass; best: Pass; selected: Pass; sportColor: string }) => {
  if (pass.sessionId === best.sessionId) return BEST_PALETTE.line;
  if (pass.sessionId === selected.sessionId) return sportColor;
  return tokens.textTertiary;
};

export const PassTimesRow: FC<PassTimesRowProps> = (props) => {
  const [showAll, setShowAll] = useState(false);
  const [windowIds, setWindowIds] = useState(() => latestWindowIds(props.segment));
  const fastestFirst = passesFastestFirst(props.segment).filter(
    (p) => windowIds === null || windowIds.has(p.sessionId) || p.sessionId === props.best.sessionId || p.sessionId === props.origin?.sessionId,
  );
  const collapsedIds = new Set(fastestFirst.slice(0, COLLAPSED_PASS_COUNT).map((p) => p.sessionId));
  if (props.origin !== undefined) collapsedIds.add(props.origin.sessionId);
  let visiblePasses = fastestFirst;
  if (!showAll) visiblePasses = fastestFirst.filter((p) => collapsedIds.has(p.sessionId));
  const moreCount = fastestFirst.length - fastestFirst.filter((p) => collapsedIds.has(p.sessionId)).length;
  const toggleRef = useRef<HTMLButtonElement>(null);
  const toggleList = () => {
    if (!showAll) return setShowAll(true);
    setShowAll(false);
    requestAnimationFrame(() => toggleRef.current?.scrollIntoView({ block: 'nearest' }));
  };
  const allGaps = props.segment.passes.flatMap((pass) => gapValues({ pass, best: props.best }));
  const gapRange: [number, number] = [Math.min(0, ...allGaps), Math.max(0, ...allGaps)];
  const summary = props.text.passes(props.segment.passes.length);

  return (
    <div data-testid="pass-times-row">
      <PvCollapsibleHeader open={props.open} onClick={props.onToggle} className="justify-between rounded-2xl py-2 pr-2 pl-3">
        <PvListItemHeader variant="secondary" avatar={<ChartScatter size={20} className="text-text-secondary" />} primary={props.text.passTimes} secondary={summary} />
      </PvCollapsibleHeader>
      <PvCollapsibleContent open={props.open}>
        <div className="flex flex-col gap-3 px-3 pt-1 pb-3">
          <PassScatter onWindowChange={setWindowIds} segment={props.segment} best={props.best} selected={props.selected} sportColor={props.sportColor} onSelect={props.onSelect} />
          <div className="flex flex-col gap-2" data-testid="pass-list">
            {visiblePasses.map((pass) => (
              <PassItem
                key={pass.sessionId}
                pass={pass}
                best={props.best}
                sport={props.segment.sport}
                selected={pass.sessionId === props.selected.sessionId}
                lang={props.lang}
                text={props.text}
                gapRange={gapRange}
                lineColor={lineColorFor({ pass, best: props.best, selected: props.selected, sportColor: props.sportColor })}
                onSelect={props.onSelect}
              />
            ))}
            {moreCount > 0 && (
              <PvButton ref={toggleRef} variant="secondary" data-testid="show-more-passes" aria-expanded={showAll} onClick={toggleList}>
                {showAll ? props.text.showFewerPasses : props.text.showMorePasses(moreCount)}
              </PvButton>
            )}
          </div>
        </div>
      </PvCollapsibleContent>
    </div>
  );
};
