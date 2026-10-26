import type { Sport } from '@pacevault/engine/types.ts';
import { tokens, type TokenColor } from '@pacevault/ui/lib/tokens.ts';

export const sportColors: Record<Sport, TokenColor> = {
  running: tokens.sportRunning,
  cycling: tokens.sportCycling,
};
