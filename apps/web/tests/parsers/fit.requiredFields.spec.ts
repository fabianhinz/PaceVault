import { describe, it, expect, vi } from 'vite-plus/test';

const parsed = vi.hoisted((): { data: Record<string, unknown> } => ({ data: {} }));

vi.mock('fit-file-parser', () => ({
  default: class {
    parseAsync = async () => parsed.data;
  },
}));

import { parseFitFile } from '@/parsers/fit.ts';

const profile = () => ({ restHr: 50, maxHr: 190, gender: 'male' as const });

const session = {
  start_time: '2026-01-01T09:00:00.000Z',
  sport: 'running',
  total_elapsed_time: 120,
  total_timer_time: 100,
  total_distance: 300,
};

const lap = {
  start_time: '2026-01-01T09:00:00.000Z',
  timestamp: '2026-01-01T09:02:00.000Z',
  total_elapsed_time: 120,
  total_timer_time: 100,
};

const parse = (data: Record<string, unknown>) => {
  parsed.data = data;
  return parseFitFile({ arrayBuffer: new ArrayBuffer(0), fileName: 'run.fit', profileAt: profile });
};

const without = <T extends Record<string, unknown>>(value: T, key: keyof T & string) => {
  const copy: Record<string, unknown> = { ...value };
  delete copy[key];
  return copy;
};

describe('parseFitFile required fields', () => {
  it('rejects a file without a session message', async () => {
    await expect(parse({ sessions: [], records: [{ elapsed_time: 0 }] })).rejects.toThrow(
      'Failed to parse FIT file "run.fit": session is missing',
    );
  });

  it('rejects a session without start_time', async () => {
    await expect(parse({ sessions: [without(session, 'start_time')] })).rejects.toThrow(
      'start_time is missing',
    );
  });

  it('rejects a session without total_timer_time', async () => {
    await expect(parse({ sessions: [without(session, 'total_timer_time')] })).rejects.toThrow(
      'total_timer_time is missing',
    );
  });

  it('rejects a record without timestamp', async () => {
    await expect(
      parse({ sessions: [session], records: [{ elapsed_time: 0 }, { elapsed_time: Number.NaN }] }),
    ).rejects.toThrow('invalid record 1.elapsed_time');
  });

  it.each(['start_time', 'timestamp', 'total_elapsed_time', 'total_timer_time'] as const)(
    'rejects a lap without %s',
    async (field) => {
      await expect(parse({ sessions: [session], laps: [without(lap, field)] })).rejects.toThrow(
        `invalid lap 0.${field}`,
      );
    },
  );
});

describe('parseFitFile optional data', () => {
  it('accepts a session without laps, records, file id or activity', async () => {
    const result = await parse({ sessions: [session] });
    expect(result.records).toEqual([]);
    expect(result.laps).toEqual([]);
    expect(result.session.duration).toBe(100);
    expect(result.session.distance).toBe(300);
  });

  it('leaves session distance undefined when neither records nor session have one', async () => {
    const result = await parse({ sessions: [without(session, 'total_distance')] });
    expect(result.session.distance).toBeUndefined();
  });

  it('prefers the last recorded distance, including 0', async () => {
    const result = await parse({
      sessions: [session],
      records: [{ elapsed_time: 0, distance: 0 }],
    });
    expect(result.session.distance).toBe(0);
  });

  it('lap distance undefined when missing', async () => {
    const result = await parse({ sessions: [session], laps: [lap] });
    expect(result.laps[0]?.distance).toBeUndefined();
  });

  it('counts recorded zeros in avg power and cadence', async () => {
    const result = await parse({
      sessions: [session],
      records: [
        { elapsed_time: 0, power: 200, cadence: 90 },
        { elapsed_time: 1, power: 0, cadence: 0 },
        { elapsed_time: 2, power: 200, cadence: 90 },
      ],
    });
    expect(result.session.avgPower).toBe(100);
    expect(result.session.avgCadence).toBe(45);
  });

  it('derives avg and max HR from the records when the summary lacks them', async () => {
    const result = await parse({
      sessions: [session],
      records: [
        { elapsed_time: 0, heart_rate: 120 },
        { elapsed_time: 1, heart_rate: 140 },
        { elapsed_time: 2, heart_rate: 160 },
        { elapsed_time: 3, heart_rate: 150 },
      ],
    });
    expect(result.session.avgHr).toBe(150);
    expect(result.session.maxHr).toBe(160);
    expect(result.session.stressMethod).toBe('trimp');
  });

  it('keeps the summary avg and max HR over the records', async () => {
    const result = await parse({
      sessions: [{ ...session, avg_heart_rate: 130, max_heart_rate: 170 }],
      records: [
        { elapsed_time: 0, heart_rate: 120 },
        { elapsed_time: 1, heart_rate: 140 },
      ],
    });
    expect(result.session.avgHr).toBe(130);
    expect(result.session.maxHr).toBe(170);
  });
});
