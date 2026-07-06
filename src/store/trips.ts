import { v4 } from 'uuid';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { idbStorage } from '@/lib/idbStorage.ts';

export interface Trip {
  id: string;
  name: string;
  description?: string;
  sessionIds: string[];
  createdAt: number;
}

interface TripsState {
  trips: Trip[];
  createTrip: (name: string, description?: string) => string;
  deleteTrip: (id: string) => void;
  assignSession: (sessionId: string, tripId: string) => void;
  removeSessionFromTrip: (sessionId: string, tripId: string) => void;
  removeSessionFromAllTrips: (sessionId: string) => void;
  clearAll: () => void;
}

export const useTripsStore = create<TripsState>()(
  immer(
    persist(
      (set) => ({
        trips: [],
        createTrip: (name, description) => {
          const id = v4();
          const trip: Trip = {
            id,
            name,
            description,
            sessionIds: [],
            createdAt: Date.now(),
          };
          set((draft) => {
            draft.trips.push(trip);
          });
          return id;
        },
        deleteTrip: (id) =>
          set((draft) => {
            draft.trips = draft.trips.filter((t) => t.id !== id);
          }),
        assignSession: (sessionId, tripId) =>
          set((draft) => {
            for (const trip of draft.trips) {
              trip.sessionIds = trip.sessionIds.filter((sId) => sId !== sessionId);
            }
            const target = draft.trips.find((t) => t.id === tripId);
            if (target) {
              target.sessionIds.push(sessionId);
            }
          }),
        removeSessionFromTrip: (sessionId, tripId) =>
          set((draft) => {
            const trip = draft.trips.find((t) => t.id === tripId);
            if (trip) {
              trip.sessionIds = trip.sessionIds.filter((sId) => sId !== sessionId);
            }
          }),
        removeSessionFromAllTrips: (sessionId) =>
          set((draft) => {
            for (const trip of draft.trips) {
              trip.sessionIds = trip.sessionIds.filter((sId) => sId !== sessionId);
            }
          }),
        clearAll: () => set({ trips: [] }),
      }),
      {
        name: 'store-trips',
        storage: createJSONStorage(() => idbStorage),
        skipHydration: true,
        version: 1,
      },
    ),
  ),
);
