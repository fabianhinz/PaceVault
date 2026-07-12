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

// Live "you are here" position. The accuracy disc mirrors the glass surface
// (translucent white fill + faint white border); the dot is a solid locator
// with a white ring, à la Google/Apple Maps.
export const geoAccuracyFill: [number, number, number, number] = [255, 255, 255, 18];
export const geoAccuracyLine: [number, number, number, number] = [255, 255, 255, 38];
export const geoDotFill: [number, number, number, number] = [80, 140, 255, 255];
export const geoDotLine: [number, number, number, number] = [255, 255, 255, 255];
