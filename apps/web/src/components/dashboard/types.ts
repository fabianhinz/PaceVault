import type { Sport } from '@pacevault/engine/types.ts';
import { tokens, type TokenColor } from '@pacevault/ui/lib/tokens.ts';

export const DASHBOARD_HOVER_GROUP = 'dashboard';

export const CHART_COLOR_BY_SPORT: Record<Sport, TokenColor> = {
  running: tokens.sportRunning,
  cycling: tokens.sportCycling,
};
