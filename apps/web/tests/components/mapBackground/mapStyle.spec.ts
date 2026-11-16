import { describe, expect, it } from 'vite-plus/test';
import { TOKENS_BY_THEME } from '@pacevault/ui/lib/tokens.ts';
import { HILLSHADE_EXAGGERATION_BY_MAP_THEME } from '@/components/mapBackground/mapStyle.ts';

describe('HILLSHADE_EXAGGERATION_BY_MAP_THEME', () => {
  it('softens the relief on the light 3D map and keeps the dark one', () => {
    expect(HILLSHADE_EXAGGERATION_BY_MAP_THEME).toEqual({ dark: 0.6, light: 0.35 });
  });

  it('shades the light 3D map in warm brown under a pale sky that fogs toward the horizon', () => {
    const light = TOKENS_BY_THEME.light;
    expect([light.mapShadow, light.mapHillshadeHighlight]).toEqual(['#5a4a3a', '#ffffff59']);
    expect([light.mapSky, light.mapSkyHorizon, light.mapFog]).toEqual([
      '#d3e3eb',
      '#f4f1ea',
      '#f4f1ea',
    ]);
  });
});
