import { getLocale } from '@/paraglide/runtime.js';
import { m } from '@/paraglide/messages.js';
import type { PersonalBest } from '@/packages/engine/types.ts';
import type { LapAnalysis } from '@/lib/laps.ts';

// ---------------------------------------------------------------------------
// Intl instances (private)
// ---------------------------------------------------------------------------

const dateFmt = new Intl.DateTimeFormat(getLocale(), {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const dateTimeFmt = new Intl.DateTimeFormat(getLocale(), {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const localDateFmt = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// ---------------------------------------------------------------------------
// Date / time formatters
// ---------------------------------------------------------------------------

interface FormatDateOptions {
  includeTime?: boolean;
}

export const formatDate = (timestamp: number, options?: FormatDateOptions): string => {
  if (options?.includeTime) {
    return dateTimeFmt.format(timestamp);
  }
  return dateFmt.format(timestamp);
};

export const toDateString = (timestamp: number): string => {
  const parts = localDateFmt.formatToParts(timestamp);
  const y = parts.find((p) => p.type === 'year')?.value ?? '0000';
  const mo = parts.find((p) => p.type === 'month')?.value ?? '01';
  const d = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${y}-${mo}-${d}`;
};

// ---------------------------------------------------------------------------
// Duration / lap / race-time formatters
// ---------------------------------------------------------------------------

export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${mins}m`;
  if (mins > 0) return `${mins}m ${s}s`;
  return `${s}s`;
};

export const formatLapTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${mins}:${s.toString().padStart(2, '0')}`;
};

/** Smart race-time: omits hours when < 1 h. */
export const formatRaceTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.round(seconds % 60);
  if (h > 0) return `${h}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/** Always shows hours: `H:MM:SS`. */
export const formatTimeHMS = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  return `${h}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// ---------------------------------------------------------------------------
// Distance / pace / speed formatters
// ---------------------------------------------------------------------------

export const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
};

export const formatPace = (secPerKm: number): string => {
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')} /km`;
};

export const formatSpeed = (metersPerSec: number): string => {
  return `${(metersPerSec * 3.6).toFixed(1)} km/h`;
};

export const formatPaceOrSpeed = (lap: LapAnalysis, isRunning: boolean): string => {
  if (lap.paceSecPerKm === undefined) return '--';
  if (isRunning) return formatPace(lap.paceSecPerKm);
  const speedMs = 1000 / lap.paceSecPerKm;
  return formatSpeed(speedMs);
};

/** Format decimal min/km to mm:ss (for time-series pace chart axes/tooltips). */
export const formatPaceTick = (minPerKm: number): string => {
  const mins = Math.floor(minPerKm);
  const secs = Math.round((minPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatPaceInput = (seconds: number): string => {
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

export const parsePaceInput = (input: string): number | undefined => {
  const match = input.match(/^(\d{1,2}):(\d{2})$/);
  if (!match || !match[1] || !match[2]) return undefined;
  const min = Number(match[1]);
  const sec = Number(match[2]);
  if (sec >= 60) return undefined;
  const totalSec = min * 60 + sec;
  if (totalSec < 150 || totalSec > 540) return undefined; // 2:30-9:00/km
  return totalSec;
};

/** Parses `H:MM:SS` string → total seconds. */
export const parseTimeHMS = (input: string): number | undefined => {
  const match = input.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  if (!match || !match[1] || !match[2] || !match[3]) return undefined;
  const h = Number(match[1]);
  const mins = Number(match[2]);
  const s = Number(match[3]);
  if (mins >= 60 || s >= 60) return undefined;
  const total = h * 3600 + mins * 60 + s;
  if (total > 0) {
    return total;
  }
  return undefined;
};

// ---------------------------------------------------------------------------
// Personal-best labels & values
// ---------------------------------------------------------------------------

const POWER_WINDOW_LABELS: Record<number, string> = {
  5: '5 sec',
  60: '1 min',
  300: '5 min',
  1200: '20 min',
  3600: '60 min',
};

const RUNNING_DISTANCE_LABELS: Record<number, string> = {
  1000: '1 km',
  5000: '5 km',
  10000: '10 km',
  21097: m.ui_pb_half_marathon(),
  42195: m.ui_pb_marathon(),
};

export const pbLabel = (pb: PersonalBest): string => {
  if (pb.category === 'peak-power') {
    return POWER_WINDOW_LABELS[pb.window] ?? `${pb.window}s`;
  }
  if (pb.category === 'fastest-distance') {
    return RUNNING_DISTANCE_LABELS[pb.window] ?? `${pb.window} m`;
  }
  if (pb.category === 'longest') return m.ui_pb_longest();
  return m.ui_pb_elevation_gain();
};

export const formatPBValue = (pb: PersonalBest): string => {
  if (pb.category === 'peak-power') return `${pb.value}W`;
  if (pb.category === 'fastest-distance') return formatDuration(pb.value);
  if (pb.category === 'longest') return formatDistance(pb.value);
  return `${formatDistance(pb.value)} \u2191`;
};

// ---------------------------------------------------------------------------
// Sub-sport labels
// ---------------------------------------------------------------------------

const SUB_SPORT_LABELS: Record<string, string> = {
  road: m.ui_sub_sport_road(),
  trail: m.ui_sub_sport_trail(),
  mountain: m.ui_sub_sport_mountain(),
  virtual_activity: m.ui_sub_sport_virtual(),
  indoor_cycling: m.ui_sub_sport_indoor(),
  indoor_running: m.ui_sub_sport_indoor(),
  track: m.ui_sub_sport_track(),
  gravel_cycling: m.ui_sub_sport_gravel(),
  treadmill: m.ui_sub_sport_treadmill(),
};

export const formatSubSport = (subSport: string): string => {
  return (
    SUB_SPORT_LABELS[subSport] ??
    subSport.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
};
