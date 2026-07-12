import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Why tracking couldn't produce a fix: the permission was refused, or the
// device has no geolocation support / the position lookup failed.
export type GeolocationError = 'denied' | 'unavailable';

interface GeolocationState {
  tracking: boolean;
  position: [number, number] | null; // [lng, lat] — deck.gl coordinate order
  accuracy: number | null; // meters (coords.accuracy)
  error: GeolocationError | null;
  toggleTracking: () => void;
  setError: (error: GeolocationError) => void;
  setFix: (position: [number, number], accuracy: number) => void;
}

export const useGeolocationStore = create<GeolocationState>()(
  immer((set) => ({
    tracking: false,
    position: null,
    accuracy: null,
    error: null,
    toggleTracking: () =>
      set((draft) => {
        const next = !draft.tracking;
        draft.tracking = next;
        draft.error = null;
        if (!next) {
          draft.position = null;
          draft.accuracy = null;
        }
      }),
    setError: (error) =>
      set((draft) => {
        draft.error = error;
      }),
    setFix: (position, accuracy) =>
      set((draft) => {
        draft.position = position;
        draft.accuracy = accuracy;
        draft.error = null;
      }),
  })),
);
