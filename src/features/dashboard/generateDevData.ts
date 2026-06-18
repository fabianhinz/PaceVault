import { decode } from '@googlemaps/polyline-codec';
import type { Sport, SessionRecord, SessionLap, TrainingSession } from '@/packages/engine/types.ts';
import { buildSessionGPS } from '@/packages/engine/gps.ts';
import { calculateSessionStress } from '@/packages/engine/stress.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { bulkSaveSessionData, saveSessionGPS } from '@/lib/indexeddb.ts';
import { useUploadProgressStore } from '@/store/uploadProgress.ts';
import { m } from '@/paraglide/messages.js';
import {
  makeRunningRecords,
  makeCyclingRecords,
  makeLapsFromRecords,
} from '@/lib/factories/records.ts';

type RouteEntry = { name: string; polyline: string; distanceM: number };
type RouteData = { running: RouteEntry[]; cycling: RouteEntry[] };

type SessionIntent = 'long-run' | 'high-intensity' | 'easy' | 'recovery' | 'indoor';

type ScheduledSession = {
  dayOffset: number;
  sport: Sport;
  intent: SessionIntent;
};

const fetchRouteData = async (): Promise<RouteData> => {
  const res = await fetch('/testData.json');
  if (!res.ok) throw new Error(`Failed to load route data (${res.status})`);
  return res.json() as Promise<RouteData>;
};

const PERSONA = {
  gender: 'female' as const,
  maxHr: 178,
  restHr: 48,
  ftp: 200,
  thresholdPace: 300, // 5:00/km
};

const randomBetween = (min: number, max: number): number => min + Math.random() * (max - min);

const INTENSITY_CONFIG: Record<
  SessionIntent,
  Record<
    Sport,
    { durationRange: [number, number]; speedRange: [number, number]; hrRange: [number, number] }
  >
> = {
  'long-run': {
    running: { durationRange: [3600, 5400], speedRange: [0.8, 0.9], hrRange: [0.6, 0.7] },
    cycling: { durationRange: [3600, 5400], speedRange: [0.8, 0.9], hrRange: [0.6, 0.7] },
  },
  'high-intensity': {
    running: { durationRange: [1800, 2700], speedRange: [0.95, 1.1], hrRange: [0.75, 0.85] },
    cycling: { durationRange: [1800, 2700], speedRange: [0.95, 1.1], hrRange: [0.75, 0.85] },
  },
  easy: {
    running: { durationRange: [1800, 3000], speedRange: [0.7, 0.85], hrRange: [0.55, 0.65] },
    cycling: { durationRange: [3600, 7200], speedRange: [0.55, 0.7], hrRange: [0.55, 0.65] },
  },
  recovery: {
    running: { durationRange: [1500, 2400], speedRange: [0.65, 0.75], hrRange: [0.5, 0.6] },
    cycling: { durationRange: [1500, 2400], speedRange: [0.65, 0.75], hrRange: [0.5, 0.6] },
  },
  // Indoor/treadmill sessions: full records but no GPS — triggers the no-GPS banner
  indoor: {
    running: { durationRange: [1800, 3000], speedRange: [0.7, 0.85], hrRange: [0.6, 0.7] },
    cycling: { durationRange: [1800, 3600], speedRange: [0.6, 0.75], hrRange: [0.6, 0.7] },
    swimming: { durationRange: [1800, 3000], speedRange: [0.8, 1.0], hrRange: [0.6, 0.7] },
  },
};

const pickRoute = (routeData: RouteData, sport: 'running' | 'cycling', intent: SessionIntent) => {
  const routes = routeData[sport];
  if (intent === 'long-run') {
    // Pick the longest route
    return routes.reduce((longest, r) => {
      if (r.distanceM > longest.distanceM) {
        return r;
      }
      return longest;
    });
  }
  if (intent === 'high-intensity') {
    // Pick one of the shorter routes
    const sorted = [...routes].sort((a, b) => a.distanceM - b.distanceM);
    const shortRoutes = sorted.slice(0, Math.max(2, Math.ceil(sorted.length / 2)));
    const picked = shortRoutes[Math.floor(Math.random() * shortRoutes.length)];
    if (!picked) return routes[0] ?? { name: '', polyline: '', distanceM: 0 };
    return picked;
  }
  const picked = routes[Math.floor(Math.random() * routes.length)];
  if (!picked) return routes[0] ?? { name: '', polyline: '', distanceM: 0 };
  return picked;
};

const decodeAndFitGPS = (
  polyline: string,
  recordCount: number,
): Array<{ lat: number; lng: number }> => {
  const decoded = decode(polyline).map(([lat, lng]) => ({ lat, lng }));
  if (decoded.length === 0) return [];

  const result: Array<{ lat: number; lng: number }> = [];
  for (let i = 0; i < recordCount; i++) {
    const t = (i / recordCount) * decoded.length;
    const idx = Math.min(Math.floor(t), decoded.length - 1);
    const point = decoded[idx];
    if (point) result.push(point);
  }
  return result;
};

const generateRecordsWithGPS = (
  routeData: RouteData,
  sessionId: string,
  sport: Sport,
  durationSec: number,
  intent: SessionIntent,
): SessionRecord[] => {
  const config = INTENSITY_CONFIG[intent][sport];
  const hrr = PERSONA.maxHr - PERSONA.restHr;
  const baseHr = Math.round(
    PERSONA.restHr + hrr * randomBetween(config.hrRange[0], config.hrRange[1]),
  );

  let records: SessionRecord[];
  if (sport === 'running') {
    const baseSpeed =
      (1000 / PERSONA.thresholdPace) * randomBetween(config.speedRange[0], config.speedRange[1]);
    records = makeRunningRecords(sessionId, durationSec, { baseSpeed, baseHr });
  } else {
    const basePower = PERSONA.ftp * randomBetween(config.speedRange[0], config.speedRange[1]);
    records = makeCyclingRecords(sessionId, durationSec, { basePower, baseHr });
  }

  if (intent !== 'indoor') {
    // Overlay GPS coordinates from real routes
    const route = pickRoute(routeData, sport, intent);
    const gpsPoints = decodeAndFitGPS(route.polyline, durationSec);
    for (let ri = 0; ri < records.length; ri++) {
      const gps = gpsPoints[ri];
      const rec = records[ri];
      if (gps && rec) {
        records[ri] = { ...rec, lat: gps.lat, lng: gps.lng };
      }
    }
  }

  return records;
};

// Weekly template variations — each template is a 7-day plan (Mon=0 .. Sun=6)
// Rules: max 2 sessions/day, long-run and high-intensity days are solo
type DaySlot = Array<{ sport: Sport; intent: SessionIntent }>;

const WEEKLY_TEMPLATES: Array<DaySlot[]> = [
  // Template A
  [
    /* Mon */ [{ sport: 'running', intent: 'recovery' }],
    /* Tue */ [{ sport: 'running', intent: 'high-intensity' }],
    /* Wed */ [
      { sport: 'cycling', intent: 'easy' },
      { sport: 'running', intent: 'easy' },
    ],
    /* Thu */ [{ sport: 'running', intent: 'easy' }],
    /* Fri */ [{ sport: 'running', intent: 'indoor' }],
    /* Sat */ [{ sport: 'running', intent: 'long-run' }],
    /* Sun */ [{ sport: 'cycling', intent: 'easy' }],
  ],
  // Template B — swap double day to Thu
  [
    /* Mon */ [{ sport: 'running', intent: 'easy' }],
    /* Tue */ [{ sport: 'running', intent: 'high-intensity' }],
    /* Wed */ [{ sport: 'cycling', intent: 'easy' }],
    /* Thu */ [
      { sport: 'running', intent: 'easy' },
      { sport: 'cycling', intent: 'easy' },
    ],
    /* Fri */ [{ sport: 'cycling', intent: 'indoor' }],
    /* Sat */ [{ sport: 'running', intent: 'long-run' }],
    /* Sun */ [{ sport: 'running', intent: 'recovery' }],
  ],
  // Template C — long run on Sunday
  [
    /* Mon */ [{ sport: 'running', intent: 'indoor' }],
    /* Tue */ [{ sport: 'running', intent: 'high-intensity' }],
    /* Wed */ [
      { sport: 'cycling', intent: 'easy' },
      { sport: 'running', intent: 'easy' },
    ],
    /* Thu */ [{ sport: 'running', intent: 'easy' }],
    /* Fri */ [{ sport: 'running', intent: 'recovery' }],
    /* Sat */ [{ sport: 'cycling', intent: 'easy' }],
    /* Sun */ [{ sport: 'running', intent: 'long-run' }],
  ],
];

const buildWeeklySchedule = (weekStartDayOffset: number): ScheduledSession[] => {
  const template = WEEKLY_TEMPLATES[Math.floor(Math.random() * WEEKLY_TEMPLATES.length)];
  if (!template) return [];
  const sessions: ScheduledSession[] = [];

  for (let day = 0; day < 7; day++) {
    const dayOffset = weekStartDayOffset + day;
    if (dayOffset < 0) continue; // skip days before our window
    const slots = template[day];
    if (!slots) continue;
    for (const slot of slots) {
      sessions.push({ dayOffset, sport: slot.sport, intent: slot.intent });
    }
  }

  return sessions;
};

const generateAllSessions = (daySpan: number): ScheduledSession[] => {
  const totalWeeks = Math.ceil(daySpan / 7);
  const allSessions: ScheduledSession[] = [];

  for (let week = 0; week < totalWeeks; week++) {
    // Week 0 starts at dayOffset 0 (most recent), increasing into the past
    const weekStart = week * 7;
    const weekSessions = buildWeeklySchedule(weekStart);
    for (const s of weekSessions) {
      if (s.dayOffset < daySpan) {
        allSessions.push(s);
      }
    }
  }

  return allSessions;
};

const generateSessionDuration = (sport: Sport, intent: SessionIntent): number => {
  const config = INTENSITY_CONFIG[intent][sport];
  return Math.round(randomBetween(config.durationRange[0], config.durationRange[1]));
};

export const generateDevData = async (): Promise<number> => {
  const routeData = await fetchRouteData();

  // Set user profile
  useUserStore.getState().setProfile({
    gender: PERSONA.gender,
    thresholds: {
      maxHr: PERSONA.maxHr,
      restHr: PERSONA.restHr,
      ftp: PERSONA.ftp,
      thresholdPace: PERSONA.thresholdPace,
    },
    showMetricHelp: true,
    useAutoSessionNames: false,
  });

  const now = Date.now();
  const daySpan = 90;

  const schedule = generateAllSessions(daySpan);

  // Build session data
  const sessionsToAdd: Array<Omit<TrainingSession, 'id' | 'createdAt'>> = [];
  const sessionMeta: Array<{ sport: Sport; durationSec: number; intent: SessionIntent }> = [];

  for (const entry of schedule) {
    const durationSec = generateSessionDuration(entry.sport, entry.intent);
    const date = now - entry.dayOffset * 24 * 60 * 60 * 1000 + randomBetween(6, 20) * 3600 * 1000;

    sessionMeta.push({ sport: entry.sport, durationSec, intent: entry.intent });

    sessionsToAdd.push({
      sport: entry.sport,
      date,
      duration: durationSec,
      distance: 0,
      tss: 0,
      stressMethod: 'duration',
      sensorWarnings: [],
      isPlanned: false,
      hasDetailedRecords: true,
    });
  }

  useUploadProgressStore.getState().startUpload(schedule.length);

  const sessionIds = useSessionsStore.getState().addSessions(sessionsToAdd);

  const updates: Array<{
    id: string;
    session: Omit<TrainingSession, 'id' | 'createdAt'>;
  }> = [];

  const bulkEntries: Array<{
    records: SessionRecord[];
    laps: SessionLap[];
  }> = [];
  const gpsPromises: Promise<void>[] = [];

  for (let i = 0; i < sessionIds.length; i++) {
    const sessionId = sessionIds[i];
    const meta = sessionMeta[i];
    const original = sessionsToAdd[i];
    if (!sessionId || !meta || !original) continue;
    const sport = meta.sport;
    const durationSec = meta.durationSec;
    const intent = meta.intent;

    const records = generateRecordsWithGPS(routeData, sessionId, sport, durationSec, intent);

    const lastRecord = records[records.length - 1];
    const distance = lastRecord?.distance ?? 0;
    const hrRecords = records.filter((r) => r.hr != null);
    const avgHr = hrRecords.reduce((sum, r) => sum + (r.hr ?? 0), 0) / hrRecords.length;
    const maxHrVal = Math.max(...hrRecords.map((r) => r.hr ?? 0));
    const speedRecords = records.filter((r) => r.speed != null);
    const avgSpeed = speedRecords.reduce((sum, r) => sum + (r.speed ?? 0), 0) / speedRecords.length;
    let avgPace: number | undefined = undefined;
    if (avgSpeed > 0) {
      avgPace = Math.round(1000 / avgSpeed);
    }

    let avgPower: number | undefined = undefined;
    let maxPower: number | undefined = undefined;
    let avgCadence: number | undefined = undefined;
    if (sport === 'cycling') {
      const powerRecords = records.filter((r) => r.power != null);
      avgPower = Math.round(
        records.reduce((sum, r) => sum + (r.power ?? 0), 0) / powerRecords.length,
      );
      maxPower = Math.round(Math.max(...powerRecords.map((r) => r.power ?? 0)));
      const cadenceRecords = records.filter((r) => r.cadence != null);
      avgCadence = Math.round(
        records.reduce((sum, r) => sum + (r.cadence ?? 0), 0) / cadenceRecords.length,
      );
    }

    const elevationGain = Math.round(
      records.reduce((sum, r, idx) => {
        if (idx === 0 || r.elevation == null) return sum;
        const prevElev = records[idx - 1]?.elevation;
        if (prevElev == null) return sum;
        const diff = r.elevation - prevElev;
        if (diff > 0) {
          return sum + diff;
        }
        return sum;
      }, 0),
    );

    const stress = calculateSessionStress(
      records,
      durationSec,
      avgHr,
      PERSONA.restHr,
      PERSONA.maxHr,
      PERSONA.gender,
      PERSONA.ftp,
    );

    updates.push({
      id: sessionId,
      session: {
        ...original,
        distance: Math.round(distance),
        avgHr: Math.round(avgHr),
        maxHr: Math.round(maxHrVal),
        avgSpeed: Math.round(avgSpeed * 100) / 100,
        avgPace,
        avgPower,
        maxPower,
        normalizedPower: stress.normalizedPower,
        avgCadence,
        elevationGain,
        calories: Math.round(durationSec * randomBetween(0.15, 0.25)),
        tss: stress.tss,
        stressMethod: stress.stressMethod,
      },
    });

    const laps = makeLapsFromRecords(sessionId, records, 300);
    const gps = buildSessionGPS(sessionId, records);

    bulkEntries.push({ records, laps });
    if (gps) {
      gpsPromises.push(saveSessionGPS(gps));
    }
    useUploadProgressStore.getState().advance();
  }

  await Promise.all([bulkSaveSessionData(bulkEntries), ...gpsPromises]);

  useSessionsStore.getState().replaceSessions(updates);
  useUploadProgressStore
    .getState()
    .finish(m.toast_devdata_generated({ count: String(sessionIds.length) }), 'success');

  return sessionIds.length;
};
