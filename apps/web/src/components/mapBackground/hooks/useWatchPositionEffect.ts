import { useEffect } from 'react';
import { useGeolocationStore } from '@/store/geolocation.ts';
import { MS_PER_SECOND } from '@pacevault/engine/time.ts';

const GEOLOCATION_TIMEOUT_MS = 10 * MS_PER_SECOND;

/**
 * Streams the device position into the geolocation store while tracking is on,
 * and clears the watch on toggle-off / unmount. Owns only the geolocation
 * stream — the camera reaction to a fix lives in the map camera layer
 * (useGeolocationCameraEffect).
 */
export const useWatchPositionEffect = (): void => {
  const tracking = useGeolocationStore((s) => s.tracking);

  useEffect(() => {
    if (!tracking) {
      return;
    }

    if (!('geolocation' in navigator)) {
      useGeolocationStore.getState().setError('unavailable');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        useGeolocationStore.getState().setFix({
          position: [pos.coords.longitude, pos.coords.latitude],
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          useGeolocationStore.getState().setError('denied');
        } else {
          useGeolocationStore.getState().setError('unavailable');
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: GEOLOCATION_TIMEOUT_MS },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [tracking]);
};
