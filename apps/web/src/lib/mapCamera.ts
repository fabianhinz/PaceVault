import type { MapView } from '@/store/mapControls.ts';

export type MapCameraTarget =
  | { kind: 'overview' }
  | { kind: 'session'; sessionId: string; lapIndex: number | null; view: MapView }
  | { kind: 'trip'; tripKey: string }
  | { kind: 'studioTab' }
  | { kind: 'studioRoute'; routeId: string };

export type MapCameraFit =
  | 'overview'
  | 'session'
  | 'lap'
  | 'lapClose'
  | 'tilt'
  | 'flatten'
  | 'trip'
  | 'studio';

const SESSION_ZOOM_OUT_LEVELS = 2;

export interface MapCameraObservation {
  target: MapCameraTarget;
  visibleKey: string;
  visibleCount: number;
  filter: unknown;
  lapCloseCount: number;
  refitRequest: number;
  studioHasBounds: boolean;
  sessionDataBlocked: boolean;
  progressOverlayOpen: boolean;
}

export interface MapCameraState {
  target: MapCameraTarget | null;
  pending: MapCameraFit | null;
  initialDone: boolean;
  visibleKey: string;
  filter: unknown;
  lapCloseCount: number;
  refitRequest: number;
}

export const initialMapCameraState: MapCameraState = {
  target: null,
  pending: null,
  initialDone: false,
  visibleKey: '',
  filter: null,
  lapCloseCount: 0,
  refitRequest: 0,
};

const isSameSubject = (a: MapCameraTarget | null, b: MapCameraTarget): boolean => {
  if (a === null) return false;
  if (a.kind === 'session' && b.kind === 'session') return a.sessionId === b.sessionId;
  if (a.kind === 'trip' && b.kind === 'trip') return a.tripKey === b.tripKey;
  if (a.kind === 'studioRoute' && b.kind === 'studioRoute') return a.routeId === b.routeId;
  return a.kind === b.kind;
};

const studioFit = (obs: MapCameraObservation): MapCameraFit | null => {
  if (obs.studioHasBounds) return 'studio';
  return null;
};

const overviewRefit = (obs: MapCameraObservation): MapCameraFit | null => {
  if (obs.visibleCount > 0) return 'overview';
  return null;
};

const arrivalFit = ({
  previous,
  obs,
  refitRequested,
}: {
  previous: MapCameraTarget | null;
  obs: MapCameraObservation;
  refitRequested: boolean;
}): MapCameraFit | null => {
  const target = obs.target;
  switch (target.kind) {
    case 'session':
      if (target.lapIndex !== null) return 'lap';
      return 'session';
    case 'trip':
      return 'trip';
    case 'studioRoute':
      return studioFit(obs);
    case 'studioTab':
      if (previous?.kind === 'studioRoute' && !refitRequested) return null;
      return studioFit(obs);
    case 'overview':
      if (refitRequested) return overviewRefit(obs);
      return null;
  }
};

const lapChangeFit = ({
  state,
  previousLap,
  lapIndex,
  lapCloseCount,
}: {
  state: MapCameraState;
  previousLap: number | null;
  lapIndex: number | null;
  lapCloseCount: number;
}): MapCameraFit | null => {
  if (previousLap === lapIndex) return state.pending;
  if (lapIndex !== null) return 'lap';
  if (lapCloseCount > state.lapCloseCount) return 'lapClose';
  if (state.pending === 'lap') return null;
  return state.pending;
};

const sameTargetFit = ({
  state,
  previous,
  obs,
  refitRequested,
}: {
  state: MapCameraState;
  previous: MapCameraTarget;
  obs: MapCameraObservation;
  refitRequested: boolean;
}): MapCameraFit | null => {
  const target = obs.target;
  if (target.kind === 'session' && previous.kind === 'session') {
    if (target.view !== previous.view) return 'tilt';
    return lapChangeFit({
      state,
      previousLap: previous.lapIndex,
      lapIndex: target.lapIndex,
      lapCloseCount: obs.lapCloseCount,
    });
  }
  if (target.kind === 'studioTab' && refitRequested) return studioFit(obs);
  if (target.kind !== 'overview') return state.pending;
  if (refitRequested) return overviewRefit(obs);
  if (obs.filter !== state.filter && obs.visibleKey !== state.visibleKey) return 'overview';
  return state.pending;
};

const isRefitHandledBy = (target: MapCameraTarget): boolean =>
  target.kind === 'overview' || target.kind === 'studioTab';

export const nextMapCamera = ({
  state,
  obs,
}: {
  state: MapCameraState;
  obs: MapCameraObservation;
}): MapCameraState => {
  const previous = state.target;
  const refitRequested = previous !== null && obs.refitRequest > state.refitRequest;
  let pending: MapCameraFit | null;
  let refitRequest = state.refitRequest;

  if (previous === null || !isSameSubject(previous, obs.target)) {
    pending = arrivalFit({ previous, obs, refitRequested });
    refitRequest = obs.refitRequest;
    if (pending === null && previous?.kind === 'session' && previous.view === '3d') {
      pending = 'flatten';
    }
  } else {
    pending = sameTargetFit({ state, previous, obs, refitRequested });
    if (isRefitHandledBy(obs.target)) refitRequest = obs.refitRequest;
  }

  const startFit =
    obs.target.kind === 'overview' &&
    !state.initialDone &&
    obs.visibleCount > 0 &&
    !obs.sessionDataBlocked &&
    !obs.progressOverlayOpen;
  if (startFit && pending === null) pending = 'overview';

  return {
    target: obs.target,
    pending,
    initialDone: state.initialDone,
    visibleKey: obs.visibleKey,
    filter: obs.filter,
    lapCloseCount: obs.lapCloseCount,
    refitRequest,
  };
};

export const isMapCameraFitBlocked = ({
  fit,
  obs,
}: {
  fit: MapCameraFit;
  obs: MapCameraObservation;
}): boolean => {
  if (fit === 'studio' || fit === 'tilt' || fit === 'flatten') return false;
  return obs.sessionDataBlocked || obs.progressOverlayOpen;
};

export const settleMapCameraFit = (state: MapCameraState): MapCameraState => ({
  ...state,
  pending: null,
  initialDone: true,
});

export const sessionMinZoom = ({
  fitZoom,
  currentZoom,
}: {
  fitZoom: number;
  currentZoom: number;
}): number => Math.min(fitZoom - SESSION_ZOOM_OUT_LEVELS, currentZoom);
