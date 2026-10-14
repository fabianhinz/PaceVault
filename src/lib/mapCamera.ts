export type MapCameraTarget =
  | { kind: 'overview' }
  | { kind: 'session'; sessionId: string; lapIndex: number | null }
  | { kind: 'trip'; tripKey: string }
  | { kind: 'studioTab' }
  | { kind: 'studioRoute'; routeId: string };

export type MapCameraFit = 'overview' | 'session' | 'lap' | 'lapClose' | 'trip' | 'studio';

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

const sameSubject = (a: MapCameraTarget | null, b: MapCameraTarget): boolean => {
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

const arrivalFit = (
  previous: MapCameraTarget | null,
  obs: MapCameraObservation,
  refitRequested: boolean,
): MapCameraFit | null => {
  const target = obs.target;
  if (target.kind === 'session') {
    if (target.lapIndex !== null) return 'lap';
    return 'session';
  }
  if (target.kind === 'trip') return 'trip';
  if (target.kind === 'studioRoute') return studioFit(obs);
  if (target.kind === 'studioTab') {
    if (previous?.kind === 'studioRoute' && !refitRequested) return null;
    return studioFit(obs);
  }
  if (refitRequested) return overviewRefit(obs);
  return null;
};

const lapChangeFit = (
  state: MapCameraState,
  previousLap: number | null,
  lapIndex: number | null,
  lapCloseCount: number,
): MapCameraFit | null => {
  if (previousLap === lapIndex) return state.pending;
  if (lapIndex !== null) return 'lap';
  if (lapCloseCount > state.lapCloseCount) return 'lapClose';
  if (state.pending === 'lap') return null;
  return state.pending;
};

const sameTargetFit = (
  state: MapCameraState,
  previous: MapCameraTarget,
  obs: MapCameraObservation,
  refitRequested: boolean,
): MapCameraFit | null => {
  const target = obs.target;
  if (target.kind === 'session' && previous.kind === 'session') {
    return lapChangeFit(state, previous.lapIndex, target.lapIndex, obs.lapCloseCount);
  }
  if (target.kind === 'studioTab' && refitRequested) return studioFit(obs);
  if (target.kind !== 'overview') return state.pending;
  if (refitRequested) return overviewRefit(obs);
  if (obs.filter !== state.filter && obs.visibleKey !== state.visibleKey) return 'overview';
  return state.pending;
};

const refitHandledBy = (target: MapCameraTarget): boolean =>
  target.kind === 'overview' || target.kind === 'studioTab';

export const nextMapCamera = (state: MapCameraState, obs: MapCameraObservation): MapCameraState => {
  const previous = state.target;
  const refitRequested = previous !== null && obs.refitRequest > state.refitRequest;
  let pending: MapCameraFit | null;
  let refitRequest = state.refitRequest;

  if (previous === null || !sameSubject(previous, obs.target)) {
    pending = arrivalFit(previous, obs, refitRequested);
    refitRequest = obs.refitRequest;
  } else {
    pending = sameTargetFit(state, previous, obs, refitRequested);
    if (refitHandledBy(obs.target)) refitRequest = obs.refitRequest;
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

export const mapCameraFitBlocked = (fit: MapCameraFit, obs: MapCameraObservation): boolean => {
  if (fit === 'studio') return false;
  return obs.sessionDataBlocked || obs.progressOverlayOpen;
};

export const settleMapCameraFit = (state: MapCameraState): MapCameraState => ({
  ...state,
  pending: null,
  initialDone: true,
});
