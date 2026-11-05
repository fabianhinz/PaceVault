import type { FC } from 'react';
import { ChevronRight, Crown, Footprints } from 'lucide-react';
import { PvActionItem } from '@pacevault/ui/components/pvActionItem/PvActionItem.tsx';
import { PvIconTile } from '@pacevault/ui/components/pvIconTile/PvIconTile.tsx';
import { FLOATING_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { dotScale, type Pass } from './data.ts';
import { formatDate, formatDay, formatGap, formatMonth, formatRaceTime, formatShortDate } from './format.ts';
import { PvChipStrip } from './kit/pvChipStrip/PvChipStrip.tsx';
import { PvDotChip } from './kit/pvDotChip/PvDotChip.tsx';
import type { DotChipLook } from './kit/pvDotChip/types.ts';
import { BestMark } from './BestMark.tsx';

interface PassStripProps {
  passes: Pass[];
  best: Pass;
  selected: Pass;
  onSelect: (id: string) => void;
  onOpen: (pass: Pass) => void;
  look: DotChipLook;
}

const SelectedItem: FC<Pick<PassStripProps, 'best' | 'selected' | 'onOpen'>> = (props) => {
  const isBest = props.selected.id === props.best.id;
  let value = formatGap(props.selected.durationSec - props.best.durationSec);
  if (isBest) value = formatRaceTime(props.selected.durationSec);
  return (
    <PvActionItem
      size="sm"
      testId="selected-pass-item"
      label={`${props.selected.name} · ${formatDate(props.selected.date)}`}
      onClick={() => props.onOpen(props.selected)}
      className={cn(isBest && 'border-best/20')}
      decoration={isBest && <BestMark />}
      avatar={<PvIconTile icon={Footprints} className="text-sport-running" />}
      primary={props.selected.name}
      secondary={formatDate(props.selected.date)}
      value={value}
      trailing={<ChevronRight className="size-4 text-text-tertiary" aria-hidden />}
    />
  );
};

export const PassStrip: FC<PassStripProps> = (props) => {
  const scale = dotScale(props.passes);
  const bestRatio = scale(props.best.durationSec).ratio;
  return (
    <div
      data-testid="pass-strip"
      className={cn(FLOATING_CLASS, 'sticky top-0 z-raised flex shrink-0 flex-col gap-1.5 rounded-2xl p-1.5')}
    >
      <PvChipStrip label="Passes" scrollKey={`${props.passes.length}:${props.passes[0]?.id ?? ''}`}>
        {props.passes.map((pass) => {
          const isBest = pass.id === props.best.id;
          return (
            <PvDotChip
              key={pass.id}
              testId="pass-chip"
              label={props.look === 'columns' ? formatDay(pass.date) : formatShortDate(pass.date)}
              detail={props.look === 'columns' ? formatMonth(pass.date) : undefined}
              look={props.look}
              accessibleLabel={formatDate(pass.date)}
              position={scale(pass.durationSec)}
              referenceRatio={bestRatio}
              pressed={pass.id === props.selected.id}
              onPress={() => props.onSelect(pass.id)}
              tone={isBest ? 'best' : 'neutral'}
              markerIcon={isBest ? Crown : undefined}
            />
          );
        })}
      </PvChipStrip>
      <SelectedItem best={props.best} selected={props.selected} onOpen={props.onOpen} />
    </div>
  );
};
