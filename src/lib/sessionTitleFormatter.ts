import { m } from '@/paraglide/messages.js';
import type { Sport } from '@/packages/engine/types.ts';
import { HR_ZONE_DEFS } from '@/packages/engine/zoneDistribution.ts';
import { formatDate } from '@/lib/formatters.ts';

const getTimeOfDayLabel = (hour: number): string => {
  if (hour >= 5 && hour <= 11) {
    return m.ui_time_morning();
  }
  if (hour >= 12 && hour <= 16) {
    return m.ui_time_afternoon();
  }
  if (hour >= 17 && hour <= 20) {
    return m.ui_time_evening();
  }
  return m.ui_time_night();
};

const SPORT_NOUN_MAP: Record<Sport, () => string> = {
  running: m.ui_sport_run,
  cycling: m.ui_sport_ride,
};

const SUB_SPORT_PREFIX_MAP: Record<string, () => string> = {
  trail: m.ui_sub_sport_trail,
  treadmill: m.ui_sub_sport_treadmill,
  indoor_running: m.ui_sub_sport_indoor,
  indoor_cycling: m.ui_sub_sport_indoor,
  track: m.ui_sub_sport_track,
  virtual_activity: m.ui_sub_sport_virtual,
  gravel_cycling: m.ui_sub_sport_gravel,
  mountain: m.ui_sub_sport_mountain,
};

const ZONE_LABEL_MAP: Record<string, () => string> = {
  recovery: m.ui_zone_recovery,
  aerobic: m.ui_zone_aerobic,
  tempo: m.ui_zone_tempo,
  threshold: m.ui_zone_threshold,
  vo2max: m.ui_zone_vo2max,
};

const buildAutoName = (sport: Sport, subSport: string | undefined, timestampMs: number): string => {
  const hour = new Date(timestampMs).getHours();
  const timeOfDay = getTimeOfDayLabel(hour);
  const sportNoun = SPORT_NOUN_MAP[sport]();

  if (subSport && subSport !== 'generic' && subSport !== 'road') {
    const prefixFn = SUB_SPORT_PREFIX_MAP[subSport];
    if (prefixFn) {
      return m.ui_session_name_sub({
        timeOfDay,
        subSport: prefixFn(),
        sport: sportNoun,
      });
    }
  }

  return m.ui_session_name({ timeOfDay, sport: sportNoun });
};
export interface SessionNameInput {
  sport: Sport;
  subSport?: string;
  date: number;
  name?: string;
}

export interface SessionNameOptions {
  useAutoNames?: boolean;
}

/**
 * Resolve a session's display title.
 *
 * When useAutoNames is true: generates a localized name from
 * time-of-day, sub-sport, and sport noun.
 *   EN: "Morning Trail Run"
 *   DE: "Trail-Lauf am Morgen"
 *
 * When useAutoNames is false (default): returns the parsed filename,
 * stored name, or formatted date as fallback.
 */
export const formatSessionName = (
  input: SessionNameInput,
  options?: SessionNameOptions,
): string => {
  const useAuto = options?.useAutoNames ?? false;

  if (useAuto) {
    return buildAutoName(input.sport, input.subSport, input.date);
  }

  return input.name ?? formatDate(input.date);
};

/**
 * Get the localized HR zone label for a session's average heart rate.
 * Returns undefined if data is insufficient or invalid.
 */
export const formatSessionZoneLabel = (
  avgHr: number | undefined,
  maxHr: number | undefined,
  restHr: number | undefined,
): string | undefined => {
  if (!avgHr || !maxHr || !restHr) {
    return undefined;
  }
  if (maxHr <= restHr || avgHr <= restHr) {
    return undefined;
  }
  const hrReserve = maxHr - restHr;
  const pct = (avgHr - restHr) / hrReserve;

  for (let i = HR_ZONE_DEFS.length - 1; i >= 0; i--) {
    const zoneDef = HR_ZONE_DEFS[i];
    if (!zoneDef) continue;
    if (pct >= zoneDef.minPct) {
      const labelFn = ZONE_LABEL_MAP[zoneDef.name];
      if (labelFn) {
        return labelFn();
      }
      return undefined;
    }
  }
  return undefined;
};
