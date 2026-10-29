import { describe, it, expect } from 'vite-plus/test';
import {
  initialMapCameraState,
  isMapCameraFitBlocked,
  nextMapCamera,
  sessionMinZoom,
  settleMapCameraFit,
  type MapCameraObservation,
  type MapCameraState,
  type MapCameraTarget,
} from '@/components/mapBackground/mapCamera.ts';
import type { MapView } from '@/store/mapControls.ts';

const filterA = { sports: ['running'] };
const filterB = { sports: ['cycling'] };

const overview: MapCameraTarget = { kind: 'overview' };
const session = (lapIndex: number | null = null, view: MapView = '2d'): MapCameraTarget => ({
  kind: 'session',
  sessionId: 's1',
  lapIndex,
  view,
});
const trip: MapCameraTarget = { kind: 'trip', tripKey: 's1,s2' };
const studioTab: MapCameraTarget = { kind: 'studioTab' };
const studioRoute: MapCameraTarget = { kind: 'studioRoute', routeId: 'r1' };

const observe = (overrides: Partial<MapCameraObservation> = {}): MapCameraObservation => ({
  target: overview,
  visibleKey: 'a,b',
  visibleCount: 2,
  filter: filterA,
  lapCloseCount: 0,
  refitRequest: 0,
  studioHasBounds: true,
  sessionDataBlocked: false,
  progressOverlayOpen: false,
  ...overrides,
});

const settledOn = (overrides: Partial<MapCameraObservation> = {}): MapCameraState =>
  settleMapCameraFit(nextMapCamera({ state: initialMapCameraState, obs: observe(overrides) }));

describe(nextMapCamera.name, () => {
  it('1: app start flies in once and the GPS re-read does not fit again', () => {
    const start = nextMapCamera({ state: initialMapCameraState, obs: observe() });
    expect(start.pending).toBe('overview');
    const reread = nextMapCamera({
      state: settleMapCameraFit(start),
      obs: observe({ visibleKey: 'a,b,c' }),
    });
    expect(reread.pending).toBeNull();
  });

  it('2: the start fit waits for tracks, background data never moves the camera', () => {
    const empty = nextMapCamera({
      state: initialMapCameraState,
      obs: observe({ visibleKey: '', visibleCount: 0 }),
    });
    expect(empty.pending).toBeNull();
    expect(nextMapCamera({ state: empty, obs: observe() }).pending).toBe('overview');
    expect(
      nextMapCamera({ state: settledOn(), obs: observe({ visibleKey: 'a,b,c' }) }).pending,
    ).toBeNull();
  });

  it('3: back from a session to the overview keeps the camera', () => {
    const onSession = settleMapCameraFit(
      nextMapCamera({ state: settledOn(), obs: observe({ target: session() }) }),
    );
    expect(nextMapCamera({ state: onSession, obs: observe() }).pending).toBeNull();
  });

  it('4: opening a session fits it', () => {
    expect(nextMapCamera({ state: settledOn(), obs: observe({ target: session() }) }).pending).toBe(
      'session',
    );
  });

  it('5: sessions-store changes on the session page do not move the camera', () => {
    const onSession = settleMapCameraFit(
      nextMapCamera({ state: settledOn(), obs: observe({ target: session() }) }),
    );
    expect(
      nextMapCamera({ state: onSession, obs: observe({ target: session(), visibleKey: 'x' }) })
        .pending,
    ).toBeNull();
  });

  it('6: a deep link on a session fits once and counts as the start fit', () => {
    const deepLink = nextMapCamera({
      state: initialMapCameraState,
      obs: observe({ target: session(), visibleKey: '', visibleCount: 0 }),
    });
    expect(deepLink.pending).toBe('session');
    const settled = settleMapCameraFit(deepLink);
    expect(
      nextMapCamera({ state: settled, obs: observe({ target: session() }) }).pending,
    ).toBeNull();
    expect(nextMapCamera({ state: settled, obs: observe() }).pending).toBeNull();
  });

  it('7: an explicit lap close zooms out to the session', () => {
    const lap = settleMapCameraFit(
      nextMapCamera({ state: settledOn(), obs: observe({ target: session(2) }) }),
    );
    expect(
      nextMapCamera({ state: lap, obs: observe({ target: session(), lapCloseCount: 1 }) }).pending,
    ).toBe('lapClose');
  });

  it('8: the lap camera fits only when the lap changes', () => {
    const lap = nextMapCamera({ state: settledOn(), obs: observe({ target: session(2) }) });
    expect(lap.pending).toBe('lap');
    const settled = settleMapCameraFit(lap);
    expect(
      nextMapCamera({ state: settled, obs: observe({ target: session(2), filter: filterB }) })
        .pending,
    ).toBe(null);
    expect(nextMapCamera({ state: settled, obs: observe({ target: session(3) }) }).pending).toBe(
      'lap',
    );
  });

  it('9: a pending lap fit wins over the session fit and background data keeps it', () => {
    const opened = nextMapCamera({ state: settledOn(), obs: observe({ target: session() }) });
    const lap = nextMapCamera({ state: opened, obs: observe({ target: session(1) }) });
    expect(lap.pending).toBe('lap');
    expect(
      nextMapCamera({ state: lap, obs: observe({ target: session(1), visibleKey: 'x' }) }).pending,
    ).toBe('lap');
  });

  it('10: an indirect lap clear leaves the camera', () => {
    const lap = settleMapCameraFit(
      nextMapCamera({ state: settledOn(), obs: observe({ target: session(2) }) }),
    );
    expect(nextMapCamera({ state: lap, obs: observe({ target: session() }) }).pending).toBeNull();
  });

  it('11: deleting the open session fits the overview once', () => {
    const onSession = settleMapCameraFit(
      nextMapCamera({ state: settledOn(), obs: observe({ target: session() }) }),
    );
    const requested = nextMapCamera({
      state: onSession,
      obs: observe({ target: session(), refitRequest: 1 }),
    });
    expect(requested.pending).toBeNull();
    const arrived = nextMapCamera({ state: requested, obs: observe({ refitRequest: 1 }) });
    expect(arrived.pending).toBe('overview');
    expect(
      nextMapCamera({ state: settleMapCameraFit(arrived), obs: observe({ refitRequest: 1 }) })
        .pending,
    ).toBe(null);
  });

  it('11: deleting the last session drops the refit, a later import does not fit', () => {
    const onSession = settleMapCameraFit(
      nextMapCamera({ state: settledOn(), obs: observe({ target: session() }) }),
    );
    const arrived = nextMapCamera({
      state: onSession,
      obs: observe({ refitRequest: 1, visibleKey: '', visibleCount: 0 }),
    });
    expect(arrived.pending).toBeNull();
    expect(
      nextMapCamera({
        state: arrived,
        obs: observe({ refitRequest: 1, visibleKey: 'c', visibleCount: 1 }),
      }).pending,
    ).toBeNull();
  });

  it('12: opening a trip fits the trip', () => {
    expect(nextMapCamera({ state: settledOn(), obs: observe({ target: trip }) }).pending).toBe(
      'trip',
    );
  });

  it('13: leaving a trip keeps the camera', () => {
    const onTrip = settleMapCameraFit(
      nextMapCamera({ state: settledOn(), obs: observe({ target: trip }) }),
    );
    expect(nextMapCamera({ state: onTrip, obs: observe() }).pending).toBeNull();
  });

  it('14: back from a session to its trip fits the trip again', () => {
    const onTrip = settleMapCameraFit(
      nextMapCamera({ state: settledOn(), obs: observe({ target: trip }) }),
    );
    const onSession = settleMapCameraFit(
      nextMapCamera({ state: onTrip, obs: observe({ target: session() }) }),
    );
    expect(nextMapCamera({ state: onSession, obs: observe({ target: trip }) }).pending).toBe(
      'trip',
    );
  });

  it('16: back from a route keeps the Studio camera, entering Studio fits', () => {
    const onTab = nextMapCamera({ state: settledOn(), obs: observe({ target: studioTab }) });
    expect(onTab.pending).toBe('studio');
    const onRoute = settleMapCameraFit(
      nextMapCamera({ state: settleMapCameraFit(onTab), obs: observe({ target: studioRoute }) }),
    );
    expect(
      nextMapCamera({ state: onRoute, obs: observe({ target: studioTab }) }).pending,
    ).toBeNull();
  });

  it('17: route-list changes never move the camera, deleting from the route page fits', () => {
    const onTab = settleMapCameraFit(
      nextMapCamera({ state: settledOn(), obs: observe({ target: studioTab }) }),
    );
    expect(nextMapCamera({ state: onTab, obs: observe({ target: studioTab }) }).pending).toBeNull();
    const onRoute = settleMapCameraFit(
      nextMapCamera({ state: onTab, obs: observe({ target: studioRoute }) }),
    );
    expect(
      nextMapCamera({ state: onRoute, obs: observe({ target: studioTab, refitRequest: 1 }) })
        .pending,
    ).toBe('studio');
    expect(
      nextMapCamera({
        state: onRoute,
        obs: observe({ target: studioTab, refitRequest: 1, studioHasBounds: false }),
      }).pending,
    ).toBeNull();
  });

  it('19: a filter change fits only when the visible set changes', () => {
    const settled = settledOn();
    expect(nextMapCamera({ state: settled, obs: observe({ filter: filterB }) }).pending).toBeNull();
    expect(
      nextMapCamera({ state: settled, obs: observe({ filter: filterB, visibleKey: 'a' }) }).pending,
    ).toBe('overview');
  });

  it('20: a filter change off the overview does nothing, also after going back', () => {
    const onSession = settleMapCameraFit(
      nextMapCamera({ state: settledOn(), obs: observe({ target: session() }) }),
    );
    const filtered = nextMapCamera({
      state: onSession,
      obs: observe({ target: session(), filter: filterB, visibleKey: '', visibleCount: 0 }),
    });
    expect(filtered.pending).toBeNull();
    expect(
      nextMapCamera({ state: filtered, obs: observe({ filter: filterB, visibleKey: 'a' }) })
        .pending,
    ).toBe(null);
  });

  it('21: a chart zoom that keeps the visible set does not move the camera', () => {
    const zoomed = { range: [1, 2] };
    expect(
      nextMapCamera({ state: settledOn(), obs: observe({ filter: zoomed }) }).pending,
    ).toBeNull();
    expect(
      nextMapCamera({ state: settledOn(), obs: observe({ filter: zoomed, visibleKey: 'b' }) })
        .pending,
    ).toBe('overview');
  });

  it('23: an import on a populated map does not fit, the first tracks on an empty map do', () => {
    expect(
      nextMapCamera({ state: settledOn(), obs: observe({ visibleKey: 'a,b,c', visibleCount: 3 }) })
        .pending,
    ).toBeNull();
    const empty = nextMapCamera({
      state: initialMapCameraState,
      obs: observe({ visibleKey: '', visibleCount: 0 }),
    });
    expect(
      nextMapCamera({ state: empty, obs: observe({ visibleKey: 'c', visibleCount: 1 }) }).pending,
    ).toBe('overview');
  });

  it('24: while reprocessing the start fit waits, afterwards it fits once', () => {
    const blocked = nextMapCamera({
      state: initialMapCameraState,
      obs: observe({ sessionDataBlocked: true }),
    });
    expect(blocked.pending).toBeNull();
    const done = nextMapCamera({ state: blocked, obs: observe() });
    expect(done.pending).toBe('overview');
    expect(
      nextMapCamera({ state: settleMapCameraFit(done), obs: observe({ visibleKey: 'a' }) }).pending,
    ).toBe(null);
  });

  it('23: the first-data fly-in waits until the import overlay and its summary are closed', () => {
    const empty = nextMapCamera({
      state: initialMapCameraState,
      obs: observe({ visibleKey: '', visibleCount: 0 }),
    });
    const summaryOpen = nextMapCamera({
      state: empty,
      obs: observe({ visibleKey: 'c', visibleCount: 1, progressOverlayOpen: true }),
    });
    expect(summaryOpen.pending).toBeNull();
    const dismissed = nextMapCamera({
      state: summaryOpen,
      obs: observe({ visibleKey: 'c', visibleCount: 1 }),
    });
    expect(dismissed.pending).toBe('overview');
    expect(
      nextMapCamera({
        state: settleMapCameraFit(dismissed),
        obs: observe({ visibleKey: 'c', visibleCount: 1 }),
      }).pending,
    ).toBeNull();
  });

  it('24: after a reprocess the fit waits for the track build, then fits once', () => {
    const building = nextMapCamera({
      state: initialMapCameraState,
      obs: observe({ visibleKey: 'a', visibleCount: 1, progressOverlayOpen: true }),
    });
    expect(building.pending).toBeNull();
    const built = nextMapCamera({ state: building, obs: observe() });
    expect(built.pending).toBe('overview');
    expect(
      nextMapCamera({ state: settleMapCameraFit(built), obs: observe({ visibleKey: 'a' }) })
        .pending,
    ).toBe(null);
  });

  it('24: a session fit after a reprocess is held until the track build is done', () => {
    const deepLink = nextMapCamera({
      state: initialMapCameraState,
      obs: observe({ target: session(), progressOverlayOpen: true }),
    });
    expect(deepLink.pending).toBe('session');
    expect(
      isMapCameraFitBlocked({
        fit: 'session',
        obs: observe({ target: session(), progressOverlayOpen: true }),
      }),
    ).toBe(true);
    expect(isMapCameraFitBlocked({ fit: 'session', obs: observe({ target: session() }) })).toBe(
      false,
    );
    expect(
      isMapCameraFitBlocked({
        fit: 'studio',
        obs: observe({ target: studioTab, progressOverlayOpen: true }),
      }),
    ).toBe(false);
  });

  it('25: switching the map view on the session tilts the camera, in both directions', () => {
    const onSession = settleMapCameraFit(
      nextMapCamera({ state: settledOn(), obs: observe({ target: session() }) }),
    );
    const into3d = nextMapCamera({
      state: onSession,
      obs: observe({ target: session(null, '3d') }),
    });
    expect(into3d.pending).toBe('tilt');
    const back = nextMapCamera({
      state: settleMapCameraFit(into3d),
      obs: observe({ target: session(null, '2d') }),
    });
    expect(back.pending).toBe('tilt');
  });

  it('26: a lap change in 3D still fits the lap', () => {
    const in3d = settleMapCameraFit(
      nextMapCamera({
        state: settleMapCameraFit(
          nextMapCamera({ state: settledOn(), obs: observe({ target: session() }) }),
        ),
        obs: observe({ target: session(null, '3d') }),
      }),
    );
    expect(nextMapCamera({ state: in3d, obs: observe({ target: session(2, '3d') }) }).pending).toBe(
      'lap',
    );
  });

  it('27: leaving a 3D session for the overview flattens the camera, a 2D one keeps it', () => {
    const in3d = settleMapCameraFit(
      nextMapCamera({ state: settledOn(), obs: observe({ target: session(null, '3d') }) }),
    );
    expect(nextMapCamera({ state: in3d, obs: observe() }).pending).toBe('flatten');
    const in2d = settleMapCameraFit(
      nextMapCamera({ state: settledOn(), obs: observe({ target: session() }) }),
    );
    expect(nextMapCamera({ state: in2d, obs: observe() }).pending).toBeNull();
  });

  it('28: tilt and flatten are never held back by a delete or an import overlay', () => {
    const blocked = observe({
      target: session(),
      sessionDataBlocked: true,
      progressOverlayOpen: true,
    });
    expect(isMapCameraFitBlocked({ fit: 'tilt', obs: blocked })).toBe(false);
    expect(isMapCameraFitBlocked({ fit: 'flatten', obs: blocked })).toBe(false);
    expect(isMapCameraFitBlocked({ fit: 'session', obs: blocked })).toBe(true);
  });
});

describe(sessionMinZoom.name, () => {
  it('limits zooming out to two levels below the session fit', () => {
    expect(sessionMinZoom({ fitZoom: 13, currentZoom: 13 })).toBe(11);
  });

  it('never clamps: a current zoom below the limit becomes the limit', () => {
    expect(sessionMinZoom({ fitZoom: 13, currentZoom: 9.5 })).toBe(9.5);
  });
});
