import { memo, type FC } from 'react';
import { Bike, ChevronRight, Crown, Footprints } from 'lucide-react';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { Copy, Lang } from './copy.ts';
import { DATA, type Pass, type Sport } from './data.ts';
import { gapText, raceTime, shortDate } from './format.ts';
import { GapSpark } from './GapSpark.tsx';
import { setHover, useHoveredPassId } from './hoverStore.ts';
import { BEST_PALETTE } from './bestPalette.ts';

const ICON_BY_SPORT = { running: Footprints, cycling: Bike };
const BADGE_CLASS_BY_SPORT = {
  running: 'bg-sport-running-muted text-sport-running',
  cycling: 'bg-sport-cycling-muted text-sport-cycling',
};

interface PassItemProps {
  pass: Pass;
  best: Pass;
  sport: Sport;
  selected: boolean;
  lang: Lang;
  text: Copy;
  gapRange: [number, number];
  lineColor: string;
  onSelect: (sessionId: string) => void;
}

const BestCrown: FC<{ label: string; color: string }> = (props) => (
  <span
    role="img"
    aria-label={props.label}
    title={props.label}
    data-testid="best-crown"
    className="pointer-events-none absolute -top-[11px] left-[2px] grid size-[18px] place-items-center drop-shadow-[0_1px_1px_rgb(0_0_0/0.6)]"
    style={{ transform: 'rotate(-15deg)', color: props.color }}
  >
    <Crown size={18} fill="currentColor" strokeWidth={1.5} />
  </span>
);

const PassItemView: FC<PassItemProps> = (props) => {
  const hovered = useHoveredPassId() === props.pass.sessionId;
  const isBest = props.pass.sessionId === props.best.sessionId;
  const Icon = ICON_BY_SPORT[props.sport];
  const shortPassDate = shortDate({ lang: props.lang, value: props.pass.date, currentYear: new Date(DATA.today).getFullYear() });
  let value = gapText(props.pass.seconds - props.best.seconds);
  if (isBest) value = raceTime(props.pass.seconds);
  return (
    <PvCard
      data-testid="pass-item"
      data-session={props.pass.sessionId}
      data-selected={props.selected}
      role="button"
      aria-pressed={props.selected}
      onClick={() => props.onSelect(props.pass.sessionId)}
      onPointerEnter={() => setHover({ kind: 'pass', sessionId: props.pass.sessionId })}
      onPointerLeave={() => setHover(null)}
      className={cn('relative cursor-pointer flex-row items-center gap-3 hover:bg-white/10', (props.selected || hovered) && 'bg-white/10')}
      style={isBest ? { borderColor: BEST_PALETTE.border } : undefined}
    >
      {isBest && <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ backgroundColor: BEST_PALETTE.tint }} />}
      {isBest && <BestCrown label={props.text.best} color={BEST_PALETTE.crown} />}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', BADGE_CLASS_BY_SPORT[props.sport])}>
          <Icon size={18} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <PvTypography variant="subtitle1" className="truncate" data-testid="pass-title">
            {props.pass.sessionName}
          </PvTypography>
          <PvTypography variant="caption" as="p" tabularNums className="whitespace-nowrap" data-testid="pass-subtitle">
            {shortPassDate}
          </PvTypography>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="w-14">
          <GapSpark pass={props.pass} best={props.best} range={props.gapRange} color={props.lineColor} />
        </div>
        <div className="text-right" data-testid="pass-value">
          <PvTypography variant="subtitle1" tabularNums>
            {value}
          </PvTypography>
        </div>
        <PvButton
          variant="ghost"
          size="icon"
          aria-label={props.text.openSession}
          title={props.text.openSession}
          onClick={(event) => event.stopPropagation()}
        >
          <ChevronRight className="size-4" />
        </PvButton>
      </div>
    </PvCard>
  );
};

export const PassItem = memo(PassItemView);
