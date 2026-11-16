import type { Sport } from '@pacevault/engine/types.ts';
import type { TrackIntensity } from '@/store/mapPreferences.ts';
import { TOKENS_BY_THEME, tokens } from '@pacevault/ui/lib/tokens.ts';
import { rgb } from 'd3-color';
import { MAP_THEME, type MapTheme } from './mapTheme.ts';

type RgbColor = [number, number, number];
type RgbaColor = [number, number, number, number];

/** Rounded 0–255 channels of a CSS colour (hex, rgb()); d3-color does not parse oklch(). */
export const rgbChannels = (color: string): RgbColor => {
  const channels = rgb(color);
  return [Math.round(channels.r), Math.round(channels.g), Math.round(channels.b)];
};

/** deck.gl colour from a theme token's channels and an explicit 0–255 alpha. */
const tokenRgba = ({ color, alpha }: { color: string; alpha: number }): RgbaColor => [
  ...rgbChannels(color),
  alpha,
];

type TrackBlend = 'additive' | 'alpha';

// Additive builds a brightening heat ramp on the dark basemap. On a light basemap it saturates to
// white, so there passes blend with plain alpha: overlaps grow more opaque toward the sport colour.
const BLEND_PARAMETERS_BY_TRACK_BLEND = {
  additive: {
    blendColorSrcFactor: 'src-alpha',
    blendColorDstFactor: 'one',
    blendColorOperation: 'add',
    blendAlphaSrcFactor: 'one',
    blendAlphaDstFactor: 'one',
    blendAlphaOperation: 'add',
  },
  alpha: {
    blendColorSrcFactor: 'src-alpha',
    blendColorDstFactor: 'one-minus-src-alpha',
    blendColorOperation: 'add',
    blendAlphaSrcFactor: 'one',
    blendAlphaDstFactor: 'one-minus-src-alpha',
    blendAlphaOperation: 'add',
  },
} as const;

/** How the rest of the session track recedes while one lap is selected. */
export interface LapDim {
  brightness: number;
  opacity: number;
}

interface TrackStyle {
  colorBySport: Record<Sport, RgbColor>;
  alphaByIntensity: Record<TrackIntensity, number>;
  blend: TrackBlend;
  lapDim: LapDim;
  bestMarker: RgbColor;
}

const colorBySport = (theme: MapTheme): Record<Sport, RgbColor> => ({
  running: rgbChannels(TOKENS_BY_THEME[theme].sportRunning),
  cycling: rgbChannels(TOKENS_BY_THEME[theme].sportCycling),
});

/** Every track-like line on the map, one entry per place it appears. */
export const TRACK_WIDTH = {
  dashboardTrackMetres: 8,
  dashboardHoveredTrackMetres: 12,
  onboardingPreviewTrackMetres: 8,
  studioRouteMetres: 8,
  studioHighlightedRouteMetres: 12,
  openedSessionTrackMetres: 12,
  segmentTrackMetres: 12,
  selectedLapMetres: 12,
  selectedLapMinimumPixels: 5,
  selectedLapOutlineMetres: 19.2,
  selectedLapOutlineMinimumPixels: 9,
  hoveredLapPixels: 3,
  terrainTrackMinimumPixels: 3,
  terrainHoverLinePixels: 3,
  trackMinimumPixels: 2,
} as const;

export const trackModifiers = {
  alpha: { default: 80, highlighted: 255 },
};

export const TRACK_STYLE_BY_MAP_THEME: Record<MapTheme, TrackStyle> = {
  dark: {
    colorBySport: colorBySport('dark'),
    alphaByIntensity: { faint: trackModifiers.alpha.default, warm: 160, hot: 255 },
    blend: 'additive',
    lapDim: { brightness: 0.8, opacity: 1 },
    // Map twin of the theme's --color-best (amber-400), the colour of every best-pass element;
    // written out because the dark token is an oklch() value d3-color cannot parse.
    bestMarker: [255, 185, 0],
  },
  light: {
    // One step darker than the UI's sport colours, so a single pass separates from parks and
    // yellow roads on voyager.
    colorBySport: {
      running: rgbChannels(TOKENS_BY_THEME.light.sportRunningDeep),
      cycling: rgbChannels(TOKENS_BY_THEME.light.sportCyclingDeep),
    },
    // Low alphas so overlaps keep building colour, the light counterpart of dark's heat ramp: a
    // faint pass covers a quarter of the map (layer opacity 1), one pass reaches 1.41:1 (running)
    // / 1.44:1 (cycling) on the voyager land colour and ten passes 4.30:1 / 4.50:1.
    alphaByIntensity: { faint: 64, warm: 128, hot: 204 },
    blend: 'alpha',
    lapDim: { brightness: 1, opacity: 0.45 },
    bestMarker: rgbChannels(TOKENS_BY_THEME.light.best),
  },
};

const TRACK_STYLE = TRACK_STYLE_BY_MAP_THEME[MAP_THEME];

export const TRACK_COLOR_BY_SPORT = TRACK_STYLE.colorBySport;
export const ALPHA_BY_TRACK_INTENSITY = TRACK_STYLE.alphaByIntensity;
export const TRACK_BLEND = TRACK_STYLE.blend;
export const TRACK_BLEND_PARAMETERS = BLEND_PARAMETERS_BY_TRACK_BLEND[TRACK_BLEND];
export const LAP_DIM = TRACK_STYLE.lapDim;
export const BEST_MARKER_COLOR = TRACK_STYLE.bestMarker;

export const HOVER_MARKER_RADIUS_PX = 12;
export const HOVER_MARKER_RING_WIDTH_PX = 4;
export const HOVER_MARKER_RING_COLOR = tokenRgba({
  color: tokens.mapDotStroke,
  alpha: trackModifiers.alpha.default,
});
export const HOVER_MARKER_FILL_COLOR = tokenRgba({
  color: tokens.mapMarker,
  alpha: trackModifiers.alpha.highlighted,
});

export const studioRouteModifiers = {
  alpha: { default: 255, hidden: 0 },
};

// Live "you are here" position. The accuracy disc is a faint tint of the map's geo-accuracy colour;
// the dot is a solid locator with a white ring, à la Google/Apple Maps.
export const geoAccuracyFill = tokenRgba({ color: tokens.mapGeoAccuracy, alpha: 18 });
export const geoAccuracyLine = tokenRgba({ color: tokens.mapGeoAccuracy, alpha: 38 });
export const geoDotFill: [number, number, number, number] = [80, 140, 255, 255];
export const geoDotLine = tokenRgba({ color: tokens.mapMarker, alpha: 255 });

// The selected lap's casing matches the charts' selection frame, so map and chart read as one
// selection in either theme.
export const LAP_CASING_COLOR = tokenRgba({ color: tokens.chartHighlight, alpha: 255 });
export const LAP_HOVER_COLOR = tokenRgba({ color: tokens.mapHighlight, alpha: 255 });

export const PICK_CIRCLE_FILL = tokenRgba({ color: tokens.mapPickArea, alpha: 13 });
export const PICK_CIRCLE_LINE = tokenRgba({ color: tokens.mapPickArea, alpha: 25 });

export const HIGHLIGHT_TRANSITIONS = { getWidth: 300, getColor: 300 };
