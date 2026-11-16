import { describe, expect, it } from 'vite-plus/test';
import { TRACK_STYLE_BY_MAP_THEME } from '@/components/mapBackground/trackColors.ts';

describe('TRACK_STYLE_BY_MAP_THEME', () => {
  it('draws the light map one colour step darker, with low alphas that build over many passes', () => {
    expect(TRACK_STYLE_BY_MAP_THEME.light.colorBySport).toEqual({
      running: [21, 128, 61],
      cycling: [194, 65, 12],
    });
    expect(TRACK_STYLE_BY_MAP_THEME.light.alphaByIntensity).toEqual({
      faint: 64,
      warm: 128,
      hot: 204,
    });
    expect(TRACK_STYLE_BY_MAP_THEME.light.blend).toBe('alpha');
  });

  it('keeps the dark map as it was: bright sport colours, additive blend, darkened laps', () => {
    expect(TRACK_STYLE_BY_MAP_THEME.dark.colorBySport).toEqual({
      running: [74, 222, 128],
      cycling: [249, 115, 22],
    });
    expect(TRACK_STYLE_BY_MAP_THEME.dark.alphaByIntensity).toEqual({
      faint: 80,
      warm: 160,
      hot: 255,
    });
    expect(TRACK_STYLE_BY_MAP_THEME.dark.blend).toBe('additive');
    expect(TRACK_STYLE_BY_MAP_THEME.dark.lapDim).toEqual({ brightness: 0.8, opacity: 1 });
  });

  it('fades unselected laps on the light map instead of darkening them', () => {
    expect(TRACK_STYLE_BY_MAP_THEME.light.lapDim).toEqual({ brightness: 1, opacity: 0.45 });
  });
});
