import type { SessionRecord } from './types.ts';

export const MAX_MOVING_PAIR_GAP_SEC = 10;

export const activeDurationSec = ({
  previous,
  current,
}: {
  previous: SessionRecord;
  current: SessionRecord;
}): number => {
  const elapsedSec = current.timestamp - previous.timestamp;
  if (elapsedSec <= 0 || elapsedSec > MAX_MOVING_PAIR_GAP_SEC) return 0;
  return elapsedSec;
};

export const isMovingPair = ({
  previous,
  current,
}: {
  previous: SessionRecord;
  current: SessionRecord;
}): boolean => {
  if (activeDurationSec({ previous, current }) === 0) return false;
  if (previous.speed === undefined || previous.speed <= 0) return false;
  return current.speed !== undefined && current.speed > 0;
};
