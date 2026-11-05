import { startTransition, useOptimistic, type FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { PvPlotStrip } from '@pacevault/ui/components/pvPlotStrip/PvPlotStrip.tsx';
import { PvPlotStripGroup } from '@pacevault/ui/components/pvPlotStrip/PvPlotStripGroup.tsx';
import { FLOATING_LG_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { StoredSegmentPass } from '@/lib/workers/segmentsContract.ts';
import { formatDate } from '@/lib/format/formatters.ts';
import type { MatchedSegment } from './types.ts';
import { passDotScale, passesByYear } from './segmentPasses.ts';
import { PassItem } from './PassItem.tsx';
import { PassTile } from './PassTile.tsx';

interface PassStripProps {
  segment: MatchedSegment;
  best: StoredSegmentPass;
  selected: StoredSegmentPass;
  onSelect: (sessionId: string) => void;
}

export const PassStrip: FC<PassStripProps> = (props) => {
  const scale = passDotScale(props.segment.passes);
  const timeline = props.segment.passes.filter((pass) => pass.sessionId !== props.best.sessionId);
  const [pressedId, setPressedId] = useOptimistic(props.selected.sessionId);
  const pressed =
    props.segment.passes.find((pass) => pass.sessionId === pressedId) ?? props.selected;
  const select = (sessionId: string) =>
    startTransition(() => {
      setPressedId(sessionId);
      props.onSelect(sessionId);
    });
  return (
    <div
      data-testid="pass-strip"
      className={cn(
        FLOATING_LG_CLASS,
        'lg:sticky lg:top-6 z-raised flex flex-col gap-3 rounded-3xl p-3',
      )}
    >
      <PvPlotStrip
        label={m.ui_segment_passes_label()}
        scrollKey={`${props.segment.id}:${props.segment.passes.length}`}
        pinned={
          <PvPlotStripGroup label={formatDate(props.best.date, 'year')}>
            <PassTile
              pass={props.best}
              position={scale(props.best.durationSec)}
              best
              selected={props.best.sessionId === pressed.sessionId}
              onSelect={select}
            />
          </PvPlotStripGroup>
        }
      >
        {passesByYear(timeline).map((passYear) => (
          <PvPlotStripGroup
            key={passYear.year}
            label={formatDate(new Date(passYear.year, 0, 1), 'year')}
          >
            {passYear.passes.map((pass) => (
              <PassTile
                key={pass.sessionId}
                pass={pass}
                position={scale(pass.durationSec)}
                best={false}
                selected={pass.sessionId === pressed.sessionId}
                onSelect={select}
              />
            ))}
          </PvPlotStripGroup>
        ))}
      </PvPlotStrip>
      <PassItem segment={props.segment} pass={pressed} best={props.best} />
    </div>
  );
};
