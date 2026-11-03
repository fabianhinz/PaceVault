import type { FC } from 'react';
import { MoveRight, Repeat, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { PvIconTile } from '@pacevault/ui/components/pvIconTile/PvIconTile.tsx';
import { PvPageGrid } from '@pacevault/ui/components/pvPageGrid/PvPageGrid.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { GLASS_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { Copy, Lang } from './copy.ts';
import type { Pass, Segment, SegmentType } from './data.ts';
import { distance, signedMeters } from './format.ts';
import { PassTimesRow } from './PassTimesRow.tsx';
import { SegmentExplorer } from './SegmentExplorer.tsx';

export const ICON_BY_SEGMENT_TYPE: Record<SegmentType, LucideIcon> = {
  climb: TrendingUp,
  flat: MoveRight,
  descent: TrendingDown,
  route: Repeat,
};

interface SegmentPageProps {
  segment: Segment;
  best: Pass;
  origin: Pass | undefined;
  selected: Pass;
  timesOpen: boolean;
  onToggleTimes: () => void;
  onSelect: (sessionId: string) => void;
  sportColor: string;
  lang: Lang;
  text: Copy;
}

export const SegmentPage: FC<SegmentPageProps> = (props) => {
  const caption = [props.text.sport(props.segment.sport), distance(props.lang, props.segment.distanceMeters), signedMeters(props.segment.netElevationMeters)].join(' · ');
  return (
    <div className="flex flex-col gap-4" data-testid="segment-page">
      <div className="flex min-w-0 flex-1 items-center gap-2" data-testid="segment-header">
        <PvIconTile icon={ICON_BY_SEGMENT_TYPE[props.segment.type]} />
        <div className="min-w-0">
          <PvTypography variant="h2" as="h1" noWrap>
            {props.text.segmentLabel(props.segment.type, props.segment.typeNumber)}
          </PvTypography>
          <PvTypography variant="caption" as="p" color="textSecondary" tabularNums>
            {caption}
          </PvTypography>
        </div>
      </div>
      <PvPageGrid>
        <div data-testid="segment-summary" className={cn(GLASS_CLASS, 'divide-y divide-white/10 overflow-hidden rounded-2xl')}>
          <PassTimesRow
            key={`${props.segment.id}:${props.origin?.sessionId ?? ''}`}
            segment={props.segment}
            best={props.best}
            origin={props.origin}
            selected={props.selected}
            open={props.timesOpen}
            onToggle={props.onToggleTimes}
            onSelect={props.onSelect}
            sportColor={props.sportColor}
            lang={props.lang}
            text={props.text}
          />
        </div>
        <SegmentExplorer segment={props.segment} selected={props.selected} best={props.best} sportColor={props.sportColor} lang={props.lang} text={props.text} />
      </PvPageGrid>
    </div>
  );
};
