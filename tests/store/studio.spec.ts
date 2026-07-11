import { describe, it, expect, beforeEach } from 'vitest';
import { useStudioStore } from '@/store/studio.ts';
import type { StudioRoute } from '@/store/studio.ts';

const makeRouteInput = (
  overrides: Partial<Omit<StudioRoute, 'id' | 'importedAt'>> = {},
): Omit<StudioRoute, 'id' | 'importedAt'> => ({
  name: 'Alpine loop',
  sourceFileName: 'alpine-loop.gpx',
  color: 'sky',
  encodedPolylines: ['_p~iF~ps|U'],
  bounds: { minLat: 47, maxLat: 47.5, minLng: 11, maxLng: 11.5 },
  distance: 42000,
  elevation: { gain: 1200, loss: 1180, min: 600, max: 1800, maxGrade: 12.5 },
  ...overrides,
});

describe('useStudioStore', () => {
  beforeEach(() => {
    useStudioStore.setState({ routes: [] });
  });

  it('imports a route with a generated id and importedAt', () => {
    const id = useStudioStore.getState().importStudioRoute(makeRouteInput());
    const routes = useStudioStore.getState().routes;
    expect(routes).toHaveLength(1);
    expect(routes[0]?.id).toBe(id);
    expect(routes[0]?.name).toBe('Alpine loop');
    expect(routes[0]?.color).toBe('sky');
    expect(typeof routes[0]?.importedAt).toBe('number');
  });

  it('renames a route', () => {
    const id = useStudioStore.getState().importStudioRoute(makeRouteInput());
    useStudioStore.getState().renameStudioRoute(id, 'Renamed loop');
    expect(useStudioStore.getState().routes[0]?.name).toBe('Renamed loop');
  });

  it('ignores rename for an unknown id', () => {
    useStudioStore.getState().importStudioRoute(makeRouteInput());
    useStudioStore.getState().renameStudioRoute('missing', 'Nope');
    expect(useStudioStore.getState().routes[0]?.name).toBe('Alpine loop');
  });

  it('sets the route color', () => {
    const id = useStudioStore.getState().importStudioRoute(makeRouteInput());
    useStudioStore.getState().setStudioRouteColor(id, 'rose');
    expect(useStudioStore.getState().routes[0]?.color).toBe('rose');
  });

  it('deletes a route', () => {
    const a = useStudioStore.getState().importStudioRoute(makeRouteInput());
    useStudioStore.getState().importStudioRoute(makeRouteInput({ name: 'Second' }));
    useStudioStore.getState().deleteStudioRoute(a);
    const routes = useStudioStore.getState().routes;
    expect(routes).toHaveLength(1);
    expect(routes.find((r) => r.id === a)).toBeUndefined();
  });

  it('clears all routes', () => {
    useStudioStore.getState().importStudioRoute(makeRouteInput());
    useStudioStore.getState().importStudioRoute(makeRouteInput({ name: 'Second' }));
    useStudioStore.getState().clearAll();
    expect(useStudioStore.getState().routes).toEqual([]);
  });

  it('is persisted under the store-studio key at version 1', () => {
    const options = useStudioStore.persist.getOptions();
    expect(options.name).toBe('store-studio');
    expect(options.version).toBe(1);
  });
});
