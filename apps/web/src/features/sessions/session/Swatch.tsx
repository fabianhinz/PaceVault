import type { FC } from 'react';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
import { WIND_COLORS, ZONE_PALETTES } from '@/lib/zoneColors.ts';
import { SPEED_PALETTE } from '@/lib/speedScale.ts';
import type { ColorMode } from '@/lib/colorModes.ts';
import type { Sport } from '@pacevault/engine/types.ts';

const SPORT_COLOR: Record<Sport, string> = {
  running: tokens.sportRunning,
  cycling: tokens.sportCycling,
};

const gradient = (colors: readonly string[]) => `linear-gradient(to right, ${colors.join(', ')})`;

const swatchBackground = ({ mode, sport }: { mode: ColorMode; sport: Sport }): string => {
  switch (mode) {
    case 'sport':
      return SPORT_COLOR[sport];
    case 'wind':
      return gradient([WIND_COLORS.tail, WIND_COLORS.cross, WIND_COLORS.head]);
    case 'speed':
      return gradient(SPEED_PALETTE);
    case 'hr':
    case 'power':
    case 'pace':
      return gradient(ZONE_PALETTES[mode]);
  }
};

interface SwatchProps {
  mode: ColorMode;
  sport: Sport;
  muted?: boolean;
}

export const Swatch: FC<SwatchProps> = (props) => (
  <span
    aria-hidden
    className={cn('h-2 w-12 shrink-0 rounded-full', props.muted && 'opacity-30 grayscale')}
    style={{ background: swatchBackground({ mode: props.mode, sport: props.sport }) }}
  />
);
