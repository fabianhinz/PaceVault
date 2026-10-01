import { describe, it, expect, vi } from 'vitest';

const parsed = vi.hoisted(() => ({ data: {} as Record<string, unknown> }));

vi.mock('fit-file-parser', () => ({
  default: class {
    parseAsync = async () => parsed.data;
  },
}));

import { parseFitFile } from '@/parsers/fit.ts';

const profile = { restHr: 50, maxHr: 190, gender: 'male' as const };

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
  return parseFitFile(new ArrayBuffer(0), 'run.fit', profile);
};

const without = <T extends Record<string, unknown>>(value: T, key: keyof T) => {
  const copy: Record<string, unknown> = { ...value };
  delete copy[key as string];
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

  it('leaves lap distance and avg speed undefined when missing', async () => {
    const result = await parse({ sessions: [session], laps: [lap] });
    expect(result.laps[0]?.distance).toBeUndefined();
    expect(result.laps[0]?.avgSpeed).toBeUndefined();
  });

  it('counts recorded zeros in avg power and cadence', async () => {
    const result = await parse({
      sessions: [session],
      records: [
        { elapsed_time: 0, power: 0, cadence: 0 },
        { elapsed_time: 1, power: 200, cadence: 90 },
      ],
    });
    expect(result.session.avgPower).toBe(100);
    expect(result.session.avgCadence).toBe(45);
  });
});
