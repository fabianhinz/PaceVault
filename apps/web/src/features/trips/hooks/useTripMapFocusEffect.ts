import { useEffect } from 'react';
import { useMapFocusStore } from '@/store/mapFocus.ts';

export const useTripMapFocusEffect = (sessionIds: string[] | undefined): void => {
  useEffect(() => {
    useMapFocusStore.getState().setFocusedTripSessions(sessionIds ?? []);
    return () => {
      useMapFocusStore.getState().setFocusedTripSessions([]);
    };
  }, [sessionIds]);
};
