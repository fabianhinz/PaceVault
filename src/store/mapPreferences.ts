import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { z } from 'zod';
import { idbStorage } from '@/lib/idbStorage.ts';
import type { ColorMode } from '@/lib/colorModes.ts';
import type { LapSource } from '@/lib/lapSet.ts';
import { SPORTS, type Sport } from '@/packages/engine/types.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';

export const TRACK_INTENSITIES = ['faint', 'warm', 'hot'] as const;
export type TrackIntensity = (typeof TRACK_INTENSITIES)[number];

const COLOR_MODES = [
  'sport',
  'hr',
  'power',
  'pace',
  'speed',
  'wind',
] as const satisfies readonly ColorMode[];
const LAP_SOURCES = ['off', 'device', 'splits'] as const satisfies readonly LapSource[];

interface SportMapPreferences {
  colorMode: ColorMode;
  lapSource: LapSource;
  splitDistance: number | null;
}

interface MapPreferencesState {
  trackIntensity: TrackIntensity;
  bySport: Record<Sport, SportMapPreferences>;
  setTrackIntensity: (intensity: TrackIntensity) => void;
  setSessionColorMode: (sport: Sport, mode: ColorMode) => void;
  setLapSource: (sport: Sport, source: LapSource) => void;
  setSplitDistance: (sport: Sport, metres: number) => void;
  resetMapPreferences: () => void;
}

type PersistedMapPreferences = Pick<MapPreferencesState, 'trackIntensity' | 'bySport'>;

const defaultSportPreferences = (): SportMapPreferences => ({
  colorMode: 'sport',
  lapSource: 'splits',
  splitDistance: null,
});

const defaultBySport = (): Record<Sport, SportMapPreferences> => ({
  running: defaultSportPreferences(),
  cycling: defaultSportPreferences(),
});

const persistedSchema = z.looseObject({
  trackIntensity: z.unknown(),
  bySport: z.looseObject({}),
});

const trackIntensitySchema = z.enum(TRACK_INTENSITIES);
const colorModeSchema = z.enum(COLOR_MODES);
const lapSourceSchema = z.enum(LAP_SOURCES);
const splitDistanceSchema = z.number().positive().nullable();
const sportPreferencesSchema = z.looseObject({
  colorMode: z.unknown(),
  lapSource: z.unknown(),
  splitDistance: z.unknown(),
});

const parseSportPreferences = (persisted: unknown): SportMapPreferences => {
  const preferences = defaultSportPreferences();
  const parsed = sportPreferencesSchema.safeParse(persisted);
  if (!parsed.success) return preferences;
  const colorMode = colorModeSchema.safeParse(parsed.data.colorMode);
  if (colorMode.success) preferences.colorMode = colorMode.data;
  const lapSource = lapSourceSchema.safeParse(parsed.data.lapSource);
  if (lapSource.success) preferences.lapSource = lapSource.data;
  const splitDistance = splitDistanceSchema.safeParse(parsed.data.splitDistance);
  if (splitDistance.success) preferences.splitDistance = splitDistance.data;
  return preferences;
};

const parsePersistedMapPreferences = (persisted: unknown): PersistedMapPreferences => {
  const preferences: PersistedMapPreferences = {
    trackIntensity: 'warm',
    bySport: defaultBySport(),
  };
  const parsed = persistedSchema.safeParse(persisted);
  if (!parsed.success) return preferences;
  const intensity = trackIntensitySchema.safeParse(parsed.data.trackIntensity);
  if (intensity.success) preferences.trackIntensity = intensity.data;
  for (const sport of SPORTS) {
    preferences.bySport[sport] = parseSportPreferences(parsed.data.bySport[sport]);
  }
  return preferences;
};

export const useMapPreferencesStore = create<MapPreferencesState>()(
  immer(
    persist(
      (set) => ({
        trackIntensity: 'warm',
        bySport: defaultBySport(),
        setTrackIntensity: (intensity) => set({ trackIntensity: intensity }),
        setSessionColorMode: (sport, mode) =>
          set((draft) => {
            draft.bySport[sport].colorMode = mode;
          }),
        setLapSource: (sport, source) => {
          set((draft) => {
            draft.bySport[sport].lapSource = source;
          });
          useMapControlsStore.getState().clearLapFocusOnLapSetChange();
        },
        setSplitDistance: (sport, metres) => {
          set((draft) => {
            draft.bySport[sport].lapSource = 'splits';
            draft.bySport[sport].splitDistance = metres;
          });
          useMapControlsStore.getState().clearLapFocusOnLapSetChange();
        },
        resetMapPreferences: () => set({ trackIntensity: 'warm', bySport: defaultBySport() }),
      }),
      {
        name: 'store-map-preferences',
        storage: createJSONStorage(() => idbStorage),
        skipHydration: true,
        version: 1,
        partialize: (state): PersistedMapPreferences => ({
          trackIntensity: state.trackIntensity,
          bySport: state.bySport,
        }),
        merge: (persisted, current) => ({
          ...current,
          ...parsePersistedMapPreferences(persisted),
        }),
      },
    ),
  ),
);
