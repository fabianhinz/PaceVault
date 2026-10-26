import { describe, it, expect } from 'vite-plus/test';
import { useMapPreferencesStore } from '@/store/mapPreferences.ts';
import { getDB } from '@/lib/db';

const rehydrateFrom = async (state: unknown) => {
  const db = await getDB();
  await db.put('kv', JSON.stringify({ state, version: 1 }), 'store-map-preferences');
  await useMapPreferencesStore.persist.rehydrate();
  return useMapPreferencesStore.getState();
};

describe('useMapPreferencesStore', () => {
  it('keeps color by and laps per sport', () => {
    useMapPreferencesStore.getState().setSessionColorMode({ sport: 'running', mode: 'hr' });
    useMapPreferencesStore.getState().setSessionLapSource({ sport: 'running', source: 'device' });
    useMapPreferencesStore.getState().setSessionSplitDistance({ sport: 'cycling', metres: 5000 });

    expect(useMapPreferencesStore.getState().bySport).toEqual({
      running: { colorMode: 'hr', lapSource: 'device', splitDistance: null },
      cycling: { colorMode: 'sport', lapSource: 'splits', splitDistance: 5000 },
    });
  });

  it('restores stored preferences on rehydrate', async () => {
    const state = await rehydrateFrom({
      trackIntensity: 'hot',
      bySport: {
        running: { colorMode: 'pace', lapSource: 'off', splitDistance: 2000 },
        cycling: { colorMode: 'power', lapSource: 'device', splitDistance: null },
      },
    });

    expect(state.trackIntensity).toBe('hot');
    expect(state.bySport.running).toEqual({
      colorMode: 'pace',
      lapSource: 'off',
      splitDistance: 2000,
    });
    expect(state.bySport.cycling).toEqual({
      colorMode: 'power',
      lapSource: 'device',
      splitDistance: null,
    });
  });

  it('falls back to defaults for unrecognised stored values', async () => {
    const state = await rehydrateFrom({
      trackIntensity: 'blinding',
      bySport: {
        running: { colorMode: 'cadence', lapSource: 'splits', splitDistance: -5 },
        cycling: 'broken',
      },
    });

    expect(state.trackIntensity).toBe('warm');
    expect(state.bySport.running).toEqual({
      colorMode: 'sport',
      lapSource: 'splits',
      splitDistance: null,
    });
    expect(state.bySport.cycling).toEqual({
      colorMode: 'sport',
      lapSource: 'splits',
      splitDistance: null,
    });
  });
});
