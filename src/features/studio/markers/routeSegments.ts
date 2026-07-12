export interface RouteSegment {
  /** 1-based number of the segment the distance falls into. */
  index: number;
  startM: number;
  endM: number;
  /** Split ordinal (1-based) preceding the segment, or `null` for the route start. */
  startSplit: number | null;
}

/**
 * The segment a distance falls into, given the split points that cut the route.
 * Split points at or beyond the route ends are ignored. A click exactly on a
 * split belongs to the segment that starts there.
 */
export const segmentAtDistance = (
  splitDistancesM: number[],
  totalM: number,
  distanceM: number,
): RouteSegment => {
  const splits = splitDistancesM.filter((d) => d > 0 && d < totalM).sort((a, b) => a - b);

  let splitsBefore = 0;
  for (const s of splits) {
    if (s <= distanceM) splitsBefore += 1;
  }

  let startM = 0;
  if (splitsBefore > 0) startM = splits[splitsBefore - 1] ?? 0;
  let endM = totalM;
  if (splitsBefore < splits.length) endM = splits[splitsBefore] ?? totalM;

  let startSplit: number | null = splitsBefore;
  if (splitsBefore === 0) startSplit = null;

  return { index: splitsBefore + 1, startM, endM, startSplit };
};
