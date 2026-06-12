import { describe, it, expect } from 'vitest';
import { detectNewPBs, mergePBs } from '@/lib/records.ts';
import { makeCyclingRecords, makeRunningRecords } from '@tests/factories/records.ts';
import type { PersonalBest } from '@/packages/engine/types';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('detectNewPBs — cycling power', () => {
  it('detects new PBs with empty existing bests', () => {
    const now = Date.now();
    const records = makeCyclingRecords('s1', 3600, { basePower: 250 });

    const newPBs = detectNewPBs('s1', now, 'cycling', records, []);

    // Should find PBs for all 5 power windows
    const powerPBs = newPBs.filter((pb) => pb.category === 'peak-power');
    expect(powerPBs.length).toBe(5);
    expect(powerPBs.every((pb) => pb.sport === 'cycling')).toBe(true);
    expect(powerPBs.every((pb) => pb.sessionId === 's1')).toBe(true);
  });

  it('detects PB improvement over existing', () => {
    const now = Date.now();
    const records = makeCyclingRecords('s2', 3600, { basePower: 280 });

    // Existing bests with low values that should be beaten
    const windows = [5, 60, 300, 1200, 3600];
    const existingBests = windows.map((seconds) => ({
      sport: 'cycling' as const,
      category: 'peak-power' as const,
      window: seconds,
      value: 100,
      sessionId: 'old-session',
      date: now - 10 * DAY_MS,
    }));

    const newPBs = detectNewPBs('s2', now, 'cycling', records, existingBests);
    const powerPBs = newPBs.filter((pb) => pb.category === 'peak-power');
    expect(powerPBs.length).toBe(5);
    powerPBs.forEach((pb) => {
      expect(pb.value).toBeGreaterThan(100);
    });
  });

  it('no PB when existing is better', () => {
    const now = Date.now();
    const records = makeCyclingRecords('s3', 3600, { basePower: 200 });

    // Existing bests with very high values that should not be beaten
    const windows = [5, 60, 300, 1200, 3600];
    const existingBests = windows.map((seconds) => ({
      sport: 'cycling' as const,
      category: 'peak-power' as const,
      window: seconds,
      value: 500,
      sessionId: 'best-session',
      date: now - 10 * DAY_MS,
    }));

    const newPBs = detectNewPBs('s3', now, 'cycling', records, existingBests);
    const powerPBs = newPBs.filter((pb) => pb.category === 'peak-power');
    expect(powerPBs.length).toBe(0);
  });

  it('compares against all-time bests (no 90-day window)', () => {
    const now = Date.now();
    const records = makeCyclingRecords('s4', 3600, { basePower: 200 });

    // Existing PBs from > 90 days ago with high values — should still block
    const windows = [5, 60, 300, 1200, 3600];
    const existingBests = windows.map((seconds) => ({
      sport: 'cycling' as const,
      category: 'peak-power' as const,
      window: seconds,
      value: 500,
      sessionId: 'ancient-session',
      date: now - 200 * DAY_MS,
    }));

    const newPBs = detectNewPBs('s4', now, 'cycling', records, existingBests);
    const powerPBs = newPBs.filter((pb) => pb.category === 'peak-power');
    expect(powerPBs.length).toBe(0);
  });
});

describe('detectNewPBs — running distances', () => {
  it('detects distance PBs for running', () => {
    const now = Date.now();
    const records = makeRunningRecords('s1', 3600, { baseSpeed: 3.5 });

    const newPBs = detectNewPBs('s1', now, 'running', records, []);
    const distancePBs = newPBs.filter((pb) => pb.category === 'fastest-distance');

    // At 3.5 m/s for 3600s ≈ 12.6 km, should hit 1km, 5km, 10km
    expect(distancePBs.length).toBeGreaterThanOrEqual(2);
    expect(distancePBs.every((pb) => pb.sport === 'running')).toBe(true);
  });

  it('faster run beats slower run (lower time is better)', () => {
    const now = Date.now();
    const fastRecords = makeRunningRecords('fast', 3600, { baseSpeed: 4.5 });
    const slowRecords = makeRunningRecords('slow', 3600, { baseSpeed: 2.5 });

    const fastPBs = detectNewPBs('fast', now, 'running', fastRecords, []);
    const slowPBs = detectNewPBs('slow', now, 'running', slowRecords, fastPBs);

    // Slow session should NOT beat fast session times
    const slowDistancePBs = slowPBs.filter((pb) => pb.category === 'fastest-distance');
    expect(slowDistancePBs.length).toBe(0);
  });
});

describe('detectNewPBs — session-level records', () => {
  it('detects longest ride', () => {
    const now = Date.now();
    const records = makeCyclingRecords('s1', 100, { basePower: 200 });

    const newPBs = detectNewPBs('s1', now, 'cycling', records, [], {
      distance: 50000,
      elevationGain: 800,
    });
    const longest = newPBs.find((pb) => pb.category === 'longest');
    const elevation = newPBs.find((pb) => pb.category === 'most-elevation');

    expect(longest).toBeDefined();
    expect(longest?.value).toBe(50000);
    expect(elevation).toBeDefined();
    expect(elevation?.value).toBe(800);
  });

  it('detects longest run', () => {
    const now = Date.now();
    const records = makeRunningRecords('s1', 100, { baseSpeed: 3.5 });

    const newPBs = detectNewPBs('s1', now, 'running', records, [], { distance: 21000 });
    const longest = newPBs.find((pb) => pb.category === 'longest');

    expect(longest).toBeDefined();
    expect(longest?.value).toBe(21000);
  });

  it('does not produce elevation PB for non-cycling sports', () => {
    const now = Date.now();
    const records = makeRunningRecords('s1', 100, { baseSpeed: 3.5 });

    const newPBs = detectNewPBs('s1', now, 'running', records, [], {
      distance: 10000,
      elevationGain: 500,
    });
    const elevation = newPBs.find((pb) => pb.category === 'most-elevation');

    expect(elevation).toBeUndefined();
  });
});

describe('mergePBs', () => {
  it('appends into empty array', () => {
    const incoming = [
      {
        sport: 'cycling' as const,
        category: 'peak-power' as const,
        window: 300,
        value: 250,
        sessionId: 's1',
        date: Date.now(),
      },
    ];
    const result = mergePBs([], incoming);
    expect(result).toEqual(incoming);
  });

  it('replaces matching sport+category+window', () => {
    const existing = [
      {
        sport: 'cycling' as const,
        category: 'peak-power' as const,
        window: 300,
        value: 230,
        sessionId: 's1',
        date: Date.now() - DAY_MS,
      },
    ];
    const incoming = [
      {
        sport: 'cycling' as const,
        category: 'peak-power' as const,
        window: 300,
        value: 260,
        sessionId: 's2',
        date: Date.now(),
      },
    ];
    const result = mergePBs(existing, incoming);
    expect(result.length).toBe(1);
    expect(result[0].value).toBe(260);
    expect(result[0].sessionId).toBe('s2');
  });

  it('appends non-overlapping entries', () => {
    const existing = [
      {
        sport: 'cycling' as const,
        category: 'peak-power' as const,
        window: 300,
        value: 250,
        sessionId: 's1',
        date: Date.now(),
      },
    ];
    const incoming = [
      {
        sport: 'running' as const,
        category: 'fastest-distance' as const,
        window: 1000,
        value: 280,
        sessionId: 's2',
        date: Date.now(),
      },
    ];
    const result = mergePBs(existing, incoming);
    expect(result.length).toBe(2);
  });

  it('does not mutate the existing array', () => {
    const existing = [
      {
        sport: 'cycling' as const,
        category: 'peak-power' as const,
        window: 300,
        value: 230,
        sessionId: 's1',
        date: Date.now(),
      },
    ];
    const copy = [...existing];
    mergePBs(existing, [
      {
        sport: 'cycling' as const,
        category: 'peak-power' as const,
        window: 300,
        value: 260,
        sessionId: 's2',
        date: Date.now(),
      },
    ]);
    expect(existing).toEqual(copy);
  });
});

describe('multi-file upload PB accumulation', () => {
  it('fastest session gets PBs when processing multiple sessions sequentially', () => {
    const now = Date.now();
    const slowRecords = makeRunningRecords('slow', 3600, { baseSpeed: 2.5 });
    const mediumRecords = makeRunningRecords('medium', 3600, { baseSpeed: 3.5 });
    const fastRecords = makeRunningRecords('fast', 3600, { baseSpeed: 4.5 });

    let accumulatedBests: PersonalBest[] = [];

    const slowPBs = detectNewPBs('slow', now, 'running', slowRecords, accumulatedBests);
    accumulatedBests = mergePBs(accumulatedBests, slowPBs);

    const mediumPBs = detectNewPBs('medium', now, 'running', mediumRecords, accumulatedBests);
    accumulatedBests = mergePBs(accumulatedBests, mediumPBs);

    const fastPBs = detectNewPBs('fast', now, 'running', fastRecords, accumulatedBests);
    accumulatedBests = mergePBs(accumulatedBests, fastPBs);

    const distancePBs = accumulatedBests.filter((pb) => pb.category === 'fastest-distance');
    expect(distancePBs.every((pb) => pb.sessionId === 'fast')).toBe(true);
  });
});
