import { describe, expect, it } from 'vitest';

import type { SessionRecord } from '@/packages/engine/types.ts';
import {
  buildZoneColoredPath,
  buildSportColoredPath,
  buildWindColoredPath,
} from '@/features/map/zoneColoredPath.ts';
import { zoneScale, type ZoneScale } from '@/lib/zoneColors.ts';

const FALLBACK_COLOR: [number, number, number, number] = [160, 160, 160, 80];

const rec = (lat: number, lng: number, extras?: Partial<SessionRecord>): SessionRecord => ({
  timestamp: 0,
  lat,
  lng,
  ...extras,
});

const hrScale = zoneScale('hr', { maxHr: 200, restHr: 60 }) as ZoneScale;

const colorsOf = (result: ReturnType<typeof buildZoneColoredPath>) =>
  result?.color as [number, number, number, number][];

describe('buildZoneColoredPath', () => {
  it('returns null when fewer than two records have GPS', () => {
    expect(buildZoneColoredPath([], 'hr', hrScale)).toBeNull();
    const records = [rec(1, 2), { sessionId: 's1', timestamp: 0 } as SessionRecord];
    expect(buildZoneColoredPath(records, 'hr', hrScale)).toBeNull();
  });

  it('produces one [lng, lat] point and one colour per GPS record', () => {
    const records = [rec(10, 20, { hr: 150 }), rec(30, 40, { hr: 150 })];
    const result = buildZoneColoredPath(records, 'hr', hrScale);
    expect(result?.path).toEqual([
      [20, 10],
      [40, 30],
    ]);
    expect(result?.color).toHaveLength(2);
  });

  it('colours a recorded hr of 0 by its zone', () => {
    const records = [rec(1, 2, { hr: 0 }), rec(3, 4, { hr: 0 })];
    expect(colorsOf(buildZoneColoredPath(records, 'hr', hrScale))[0]).not.toEqual(FALLBACK_COLOR);
  });

  it('uses the fallback colour where the value is missing', () => {
    const records = [rec(1, 2), rec(3, 4, { hr: 150 })];
    const colors = colorsOf(buildZoneColoredPath(records, 'hr', hrScale));
    expect(colors[0]).toEqual(FALLBACK_COLOR);
    expect(colors[1]).not.toEqual(FALLBACK_COLOR);
  });
});

describe('buildWindColoredPath', () => {
  it('colours classified segments and leaves skipped ones in the fallback colour', () => {
    const records = [rec(1, 2), rec(3, 4), rec(5, 6)];
    const colors = buildWindColoredPath(records, [undefined, 'tail', 'head'])?.color as [
      number,
      number,
      number,
      number,
    ][];
    expect(colors[0]).toEqual(FALLBACK_COLOR);
    expect(colors[1]?.slice(0, 3)).toEqual([52, 211, 153]);
    expect(colors[2]?.slice(0, 3)).toEqual([239, 68, 68]);
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
