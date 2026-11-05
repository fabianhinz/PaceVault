import type { FC, Ref } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn.ts';
import { PvTypography } from '../pvTypography/PvTypography.tsx';
import { PvPlotStripMarker } from './PvPlotStripMarker.tsx';
import type { PlotStripPosition, PlotStripTone } from './types.ts';

type PlotStripTileState = 'idle' | 'pressed' | 'bestIdle' | 'bestPressed';

const SURFACE_CLASS_BY_PLOT_STRIP_TILE_STATE: Record<PlotStripTileState, string> = {
  idle: 'cursor-pointer border-white/10 hover:bg-white/10',
  pressed: 'cursor-default border-white/10 bg-white/15',
  bestIdle: 'cursor-pointer border-white/10 hover:bg-white/10',
  bestPressed: 'cursor-default border-best/20 bg-best/10',
};

const LABEL_CLASS_BY_PLOT_STRIP_TILE_STATE: Record<PlotStripTileState, string> = {
  idle: 'text-text-tertiary',
  pressed: 'text-text-primary',
  bestIdle: 'text-text-tertiary',
  bestPressed: 'text-best',
};

const plotStripTileState = ({
  tone,
  pressed,
}: {
  tone: PlotStripTone;
  pressed: boolean;
}): PlotStripTileState => {
  if (tone === 'best' && pressed) return 'bestPressed';
  if (tone === 'best') return 'bestIdle';
  if (pressed) return 'pressed';
  return 'idle';
};

interface PvPlotStripTileProps {
  label: string;
  accessibleLabel: string;
  position: PlotStripPosition;
  pressed: boolean;
  onPress: () => void;
  tone?: PlotStripTone;
  markerIcon?: LucideIcon;
  testId?: string;
  ref?: Ref<HTMLButtonElement>;
}

export const PvPlotStripTile: FC<PvPlotStripTileProps> = (props) => {
  const tone = props.tone ?? 'neutral';
  const state = plotStripTileState({ tone, pressed: props.pressed });
  return (
    <button
      ref={props.ref}
      type="button"
      aria-pressed={props.pressed}
      aria-label={props.accessibleLabel}
      data-testid={props.testId}
      data-tone={tone}
      onClick={() => {
        if (!props.pressed) props.onPress();
      }}
      className={cn(
        'relative flex size-18 shrink-0 flex-col items-center gap-0.5 rounded-lg border p-2 transition-colors',
        SURFACE_CLASS_BY_PLOT_STRIP_TILE_STATE[state],
      )}
    >
      <PvTypography
        variant="caption"
        noWrap
        tabularNums
        className={cn('leading-none', LABEL_CLASS_BY_PLOT_STRIP_TILE_STATE[state])}
      >
        {props.label}
      </PvTypography>
      <span className="relative block h-10 w-full">
        <PvPlotStripMarker position={props.position} icon={props.markerIcon} />
      </span>
    </button>
  );
};
