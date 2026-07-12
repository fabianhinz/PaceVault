import { describe, it, expect, beforeEach } from 'vitest';
import { useGeolocationStore } from '@/store/geolocation.ts';

describe('useGeolocationStore', () => {
  beforeEach(() => {
    useGeolocationStore.setState({
      tracking: false,
      position: null,
      accuracy: null,
      error: null,
    });
  });

  it('defaults to not tracking with no fix or error', () => {
    const state = useGeolocationStore.getState();
    expect(state.tracking).toBe(false);
    expect(state.position).toBeNull();
    expect(state.accuracy).toBeNull();
    expect(state.error).toBeNull();
  });

  it('toggleTracking turns tracking on', () => {
    useGeolocationStore.getState().toggleTracking();
    expect(useGeolocationStore.getState().tracking).toBe(true);
  });

  it('toggleTracking off clears the fix', () => {
    useGeolocationStore.getState().toggleTracking();
    useGeolocationStore.getState().setFix([10.5, 48.2], 12);
    useGeolocationStore.getState().toggleTracking();
    const state = useGeolocationStore.getState();
    expect(state.tracking).toBe(false);
    expect(state.position).toBeNull();
    expect(state.accuracy).toBeNull();
  });

  it('toggleTracking clears a stale error on each fresh attempt', () => {
    useGeolocationStore.getState().toggleTracking();
    useGeolocationStore.getState().setError('denied');
    useGeolocationStore.getState().toggleTracking(); // off
    expect(useGeolocationStore.getState().error).toBeNull();
    useGeolocationStore.getState().setError('unavailable');
    useGeolocationStore.getState().toggleTracking(); // on again
    expect(useGeolocationStore.getState().error).toBeNull();
  });

  it('setFix stores the position and accuracy and clears any error', () => {
    useGeolocationStore.getState().toggleTracking();
    useGeolocationStore.getState().setError('unavailable');
    useGeolocationStore.getState().setFix([10.5, 48.2], 12);
    const state = useGeolocationStore.getState();
    expect(state.position).toEqual([10.5, 48.2]);
    expect(state.accuracy).toBe(12);
    expect(state.error).toBeNull();
  });

  it('setError records the failure cause without stopping tracking', () => {
    useGeolocationStore.getState().toggleTracking();
    useGeolocationStore.getState().setError('denied');
    expect(useGeolocationStore.getState().error).toBe('denied');
    expect(useGeolocationStore.getState().tracking).toBe(true);
  });
});
