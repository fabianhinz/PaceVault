import { tokens } from '@pacevault/ui/lib/tokens.ts';

const AMBER_400 = tokens.bannerWarningIcon;

export const BEST_PALETTE = {
  line: AMBER_400,
  text: AMBER_400,
  crown: AMBER_400,
  border: `color-mix(in oklab, ${AMBER_400} 20%, transparent)`,
  tint: `color-mix(in oklab, ${AMBER_400} 3%, transparent)`,
};
