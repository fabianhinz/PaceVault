import { useEffect } from 'react';
import { useGeolocationStore } from '@/store/geolocation.ts';

/**
 * Streams the device position into the geolocation store while tracking is on,
 * and clears the watch on toggle-off / unmount. Owns only the geolocation
 * stream — the camera reaction to a fix lives in the map camera layer
 * (useGeolocationCameraEffect).
 */
export const useWatchPositionEffect = () => {
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
        useGeolocationStore
          .getState()
          .setFix([pos.coords.longitude, pos.coords.latitude], pos.coords.accuracy);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          useGeolocationStore.getState().setError('denied');
        } else {
          useGeolocationStore.getState().setError('unavailable');
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10_000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [tracking]);
};
