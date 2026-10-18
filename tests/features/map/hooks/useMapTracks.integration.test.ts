import { describe, it, expect, beforeEach } from 'vite-plus/test';
import { createElement, type ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { useMapTracks } from '@/features/map/hooks/useMapTracks.ts';
import { useStudioMapTracks } from '@/features/map/hooks/useStudioMapTracks.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useStudioStore } from '@/store/studio.ts';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';
import type { SessionGPS } from '@/packages/engine/types.ts';
import { makeSession } from '@tests/factories/sessions.ts';

const bounds = { minLat: 48, maxLat: 48.1, minLng: 11, maxLng: 11.1 };
const gpsData: SessionGPS[] = [
  { sessionId: 'ride', encodedPolyline: '_p~iF~ps|U', pointCount: 2, bounds },
];

interface MapRender {
  path: string;
  studioActive: boolean;
  routes: number;
  tracks: number;
}

const renderMapAt = (initialPath: string) => {
  const renders: MapRender[] = [];
  const wrapper = (props: { children: ReactNode }) =>
    createElement(MemoryRouter, { initialEntries: [initialPath] }, props.children);
  const hook = renderHook(
    () => {
      const location = useLocation();
      const navigate = useNavigate();
      const studio = useStudioMapTracks();
      const tracks = useMapTracks(gpsData);
      renders.push({
        path: location.pathname,
        studioActive: studio.active,
        routes: studio.routes.length,
        tracks: tracks.length,
      });
      return navigate;
    },
    { wrapper },
  );
  return { hook, renders };
};

beforeEach(() => {
  useSessionReprocessingStore.setState({ phase: 'done' });
  useSessionsStore.setState({ sessions: [makeSession({ id: 'ride' })] });
  useStudioStore.setState({
    routes: [
      {
        id: 'r1',
        name: 'Loop',
        sourceFileName: 'loop.gpx',
        importedAt: 0,
        color: 'amber',
        encodedPolylines: ['_p~iF~ps|U'],
        bounds,
        distance: 1000,
        markers: [],
      },
    ],
  });
});

describe('studio map context', () => {
  it('an unknown route id keeps the studio context without routes or session tracks', () => {
    const map = renderMapAt('/studio/unknown');
    expect(map.renders.at(-1)).toEqual({
      path: '/studio/unknown',
      studioActive: true,
      routes: 0,
      tracks: 0,
    });
  });

  it('session tracks never flash in on the way from the Studio tab to a route', () => {
    const map = renderMapAt('/');
    expect(map.renders.at(-1)?.tracks).toBe(1);

    act(() => {
      map.hook.result.current('/labs?tab=studio');
    });
    act(() => {
      map.hook.result.current('/studio/r1');
    });

    const studioRenders = map.renders.filter((render) => render.path !== '/');
    expect(studioRenders.length).toBeGreaterThan(0);
    expect(studioRenders.every((render) => render.studioActive && render.tracks === 0)).toBe(true);
    expect(map.renders.at(-1)).toEqual({
      path: '/studio/r1',
      studioActive: true,
      routes: 1,
      tracks: 0,
    });
  });
});
