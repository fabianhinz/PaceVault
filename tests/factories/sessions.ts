import type { TrainingSession } from '@/packages/engine/types.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Create a single training session with sensible defaults.
 */
export function makeSession(overrides?: Partial<TrainingSession>): TrainingSession {
  return {
    id: `session-${Date.now()}`,
    sport: 'cycling',
    date: Date.now(),
    duration: 3600,
    distance: 30000,
    avgHr: 150,
    maxHr: 175,
    avgPower: 200,
    normalizedPower: 215,
    avgCadence: 88,
    avgPace: undefined,
    calories: 800,
    elevationGain: 300,
    tss: 80,
    stressMethod: 'tss',
    sensorWarnings: [],
    isPlanned: false,
    hasDetailedRecords: true,
    createdAt: Date.now(),
    source: { kind: 'file' },
    ...overrides,
  };
}

/**
 * Create a chronological sequence of sessions spaced over days.
 * TSS varies between 60–120 using a deterministic sine pattern.
 */
export function makeSessionSequence(
  count: number,
  options?: {
    startDate?: number;
    sport?: TrainingSession['sport'];
    baseTss?: number;
    tssVariation?: number;
    daysBetween?: number;
  },
): TrainingSession[] {
  const startDate = options?.startDate ?? Date.now() - count * DAY_MS;
  const sport = options?.sport ?? 'cycling';
  const baseTss = options?.baseTss ?? 90;
  const tssVariation = options?.tssVariation ?? 30;
  const daysBetween = options?.daysBetween ?? 1;

  let stressMethod: 'tss' | 'trimp' = 'trimp';
  if (sport === 'cycling') {
    stressMethod = 'tss';
  }

  const sessions: TrainingSession[] = [];

  for (let i = 0; i < count; i++) {
    const tss = baseTss + tssVariation * Math.sin(i * 0.8);
    const date = startDate + i * daysBetween * DAY_MS;

    sessions.push(
      makeSession({
        id: `session-seq-${i}`,
        sport,
        date,
        tss: Math.round(tss * 10) / 10,
        duration: 3600 + i * 60,
        stressMethod,
        isPlanned: false,
        createdAt: date,
      }),
    );
  }

  return sessions;
}
