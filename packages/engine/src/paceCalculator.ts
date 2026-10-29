// App-specific logic — no published formula.
// See packages/engine/SOURCES.md (App-Specific Logic section).

export const timeFromPaceAndDistance = ({
  paceSecPerKm,
  distanceMeters,
}: {
  paceSecPerKm: number;
  distanceMeters: number;
}): number => paceSecPerKm * (distanceMeters / 1000);

export const paceFromDistanceAndTime = ({
  distanceMeters,
  timeSec,
}: {
  distanceMeters: number;
  timeSec: number;
}): number => timeSec / (distanceMeters / 1000);

export const distanceFromPaceAndTime = ({
  paceSecPerKm,
  timeSec,
}: {
  paceSecPerKm: number;
  timeSec: number;
}): number => (timeSec / paceSecPerKm) * 1000;
