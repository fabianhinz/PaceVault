import { describe, expect, it } from 'vitest';

import type { SessionRecord } from '@/packages/engine/types.ts';
import {
  buildZoneColoredPath,
  buildSportColoredPath,
  type UserThresholds,
} from '@/features/map/zoneColoredPath.ts';

const FALLBACK_COLOR: [number, number, number, number] = [160, 160, 160, 80];

const rec = (lat: number, lng: number, extras?: Partial<SessionRecord>): SessionRecord => ({
  timestamp: 0,
  lat,
  lng,
  ...extras,
});

const hrThresholds: UserThresholds = { maxHr: 200, restHr: 60 };

describe('buildZoneColoredPath — structural', () => {
  it('returns null for empty records', () => {
    expect(buildZoneColoredPath([], 'hr', hrThresholds)).toBeNull();
  });

  it('returns null for a single GPS record', () => {
    expect(buildZoneColoredPath([rec(1, 2)], 'hr', hrThresholds)).toBeNull();
  });

  it('returns null when only one record has GPS', () => {
    const records = [rec(1, 2), { sessionId: 's1', timestamp: 0 } as SessionRecord];
    expect(buildZoneColoredPath(records, 'hr', hrThresholds)).toBeNull();
  });

  it('produces a path and colors array of equal length', () => {
    const records = [rec(1, 2, { hr: 150 }), rec(3, 4, { hr: 150 })];
    const result = buildZoneColoredPath(records, 'hr', hrThresholds);
    expect(result).not.toBeNull();
    expect(result?.path).toHaveLength(2);
    expect(result?.color).toHaveLength(2);
  });

  it('uses [lng, lat] coordinate order', () => {
    const records = [rec(10, 20, { hr: 150 }), rec(30, 40, { hr: 150 })];
    const result = buildZoneColoredPath(records, 'hr', hrThresholds);
    expect(result?.path[0]).toEqual([20, 10]);
    expect(result?.path[1]).toEqual([40, 30]);
  });

  it('returns FALLBACK_COLOR when hrReserve <= 0', () => {
    const thresholds: UserThresholds = { maxHr: 60, restHr: 60 };
    const records = [rec(1, 2, { hr: 60 }), rec(3, 4, { hr: 60 })];
    const result = buildZoneColoredPath(records, 'hr', thresholds);
    const colors = result?.color as [number, number, number, number][];
    expect(colors[0]).toEqual(FALLBACK_COLOR);
  });

  it('returns FALLBACK_COLOR when hr is 0', () => {
    const records = [rec(1, 2, { hr: 0 }), rec(3, 4, { hr: 0 })];
    const result = buildZoneColoredPath(records, 'hr', hrThresholds);
    const colors = result?.color as [number, number, number, number][];
    expect(colors[0]).toEqual(FALLBACK_COLOR);
  });

  it('returns FALLBACK_COLOR when hr is undefined', () => {
    const records = [rec(1, 2), rec(3, 4)];
    const result = buildZoneColoredPath(records, 'hr', hrThresholds);
    const colors = result?.color as [number, number, number, number][];
    expect(colors[0]).toEqual(FALLBACK_COLOR);
  });

  it('returns FALLBACK_COLOR when ftp is missing', () => {
    const records = [rec(1, 2, { power: 150 }), rec(3, 4, { power: 150 })];
    const result = buildZoneColoredPath(records, 'power', hrThresholds);
    const colors = result?.color as [number, number, number, number][];
    expect(colors[0]).toEqual(FALLBACK_COLOR);
  });

  it('returns FALLBACK_COLOR when pace mode has thresholdPace=0', () => {
    const thresholds: UserThresholds = { maxHr: 200, restHr: 60, thresholdPace: 0 };
    const records = [rec(1, 2, { speed: 3 }), rec(3, 4, { speed: 3 })];
    const result = buildZoneColoredPath(records, 'pace', thresholds);
    const colors = result?.color as [number, number, number, number][];
    expect(colors[0]).toEqual(FALLBACK_COLOR);
  });
});

describe('buildSportColoredPath', () => {
  const color: [number, number, number, number] = [74, 222, 128, 255];

  it('returns null for empty records', () => {
    expect(buildSportColoredPath([], color)).toBeNull();
  });

  it('returns null for a single GPS record', () => {
    expect(buildSportColoredPath([rec(1, 2)], color)).toBeNull();
  });

  it('returns single color for 2+ valid records', () => {
    const records = [rec(10, 20), rec(30, 40), rec(50, 60)];
    const result = buildSportColoredPath(records, color);
    expect(result).not.toBeNull();
    expect(result?.color).toEqual(color);
    expect(result?.path).toHaveLength(3);
  });

  it('uses [lng, lat] coordinate order', () => {
    const records = [rec(10, 20), rec(30, 40)];
    const result = buildSportColoredPath(records, color);
    expect(result?.path[0]).toEqual([20, 10]);
    expect(result?.path[1]).toEqual([40, 30]);
  });

  it('filters out records with invalid coordinates', () => {
    const records = [rec(10, 20), { sessionId: 's1', timestamp: 0 } as SessionRecord, rec(30, 40)];
    const result = buildSportColoredPath(records, color);
    expect(result).not.toBeNull();
    expect(result?.path).toHaveLength(2);
  });
});
