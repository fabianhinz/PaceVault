import type { Sport } from '@/packages/engine/types.ts';

export const ADDITIVE_BLEND = {
  blendColorSrcFactor: 'src-alpha',
  blendColorDstFactor: 'one',
  blendColorOperation: 'add',
  blendAlphaSrcFactor: 'one',
  blendAlphaDstFactor: 'one',
  blendAlphaOperation: 'add',
} as const;

export const trackModifiers = {
  width: { default: 8, highlighted: 12 },
  alpha: { default: 80, highlighted: 255 },
};

export const sportTrackColor: Record<Sport, [number, number, number, number]> = {
  running: [74, 222, 128, trackModifiers.alpha.default],
  cycling: [96, 165, 250, trackModifiers.alpha.default],
};

export const sportMarkerColor: Record<Sport, [number, number, number, number]> = {
  running: [74, 222, 128, 255],
  cycling: [96, 165, 250, 255],
};
