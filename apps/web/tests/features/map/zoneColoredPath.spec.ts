import { describe, expect, it } from 'vite-plus/test';

import type { SessionRecord } from '@pacevault/engine/types.ts';
import {
  buildZoneColoredPath,
  buildSportColoredPath,
  buildWindColoredPath,
  type DetailPath,
} from '@/features/map/zoneColoredPath.ts';
import { zoneScale } from '@/lib/zoneColors.ts';
import { definedOrThrow } from '@testUtils/defined.ts';
import { createMockSessionRecord } from '@pacevault/testing/records.ts';

type Color = [number, number, number, number];

const FALLBACK_COLOR: Color = [160, 160, 160, 80];

const recordAt = (lat: number, lng: number, extras?: Partial<SessionRecord>): SessionRecord =>
  createMockSessionRecord({ lat, lng, ...extras });

const hrScale = definedOrThrow(zoneScale({ metric: 'hr', thresholds: { maxHr: 200, restHr: 60 } }));

const isColorList = (color: Color | Color[]): color is Color[] => Array.isArray(color[0]);

const colorsOf = (path: DetailPath | null): Color[] => {
  if (path === null || !isColorList(path.color)) {
    throw new Error('Expected one colour per segment');
  }
  return path.color;
};

describe(buildZoneColoredPath.name, () => {
  it('returns null when fewer than two records have GPS', () => {
    expect(buildZoneColoredPath({ records: [], metric: 'hr', scale: hrScale })).toBeNull();
    const records = [recordAt(1, 2), createMockSessionRecord()];
    expect(buildZoneColoredPath({ records, metric: 'hr', scale: hrScale })).toBeNull();
  });

  it('produces one [lng, lat] point and one colour per GPS record', () => {
    const records = [recordAt(10, 20, { hr: 150 }), recordAt(30, 40, { hr: 150 })];
    const result = buildZoneColoredPath({ records, metric: 'hr', scale: hrScale });
    expect(result?.path).toEqual([
      [20, 10],
      [40, 30],
    ]);
    expect(result?.color).toHaveLength(2);
  });

  it('colours a recorded hr of 0 by its zone', () => {
    const records = [recordAt(1, 2, { hr: 0 }), recordAt(3, 4, { hr: 0 })];
    expect(
      colorsOf(buildZoneColoredPath({ records, metric: 'hr', scale: hrScale }))[0],
    ).not.toEqual(FALLBACK_COLOR);
  });

  it('uses the fallback colour where the value is missing', () => {
    const records = [recordAt(1, 2), recordAt(3, 4, { hr: 150 })];
    const colors = colorsOf(buildZoneColoredPath({ records, metric: 'hr', scale: hrScale }));
    expect(colors[0]).toEqual(FALLBACK_COLOR);
    expect(colors[1]).not.toEqual(FALLBACK_COLOR);
  });
});

describe(buildWindColoredPath.name, () => {
  it('blends by wind angle and leaves skipped segments in the fallback colour', () => {
    const records = [
      recordAt(1, 2),
      recordAt(3, 4, { timestamp: 100 }),
      recordAt(5, 6, { timestamp: 200 }),
    ];
    const colors = colorsOf(buildWindColoredPath({ records, angles: [undefined, 180, 0] }));
    expect(colors[0]).toEqual(FALLBACK_COLOR);
    expect(colors[1]?.slice(0, 3)).toEqual([52, 211, 153]);
    expect(colors[2]?.slice(0, 3)).toEqual([239, 68, 68]);
  });
});

describe('track colour smoothing', () => {
  it('power track turns into stripes when 1 s values jump between zones', () => {
    const records = Array.from({ length: 60 }, (_, i) =>
      recordAt(48, 11 + i * 0.0001, { timestamp: i, power: i % 2 === 0 ? 150 : 350 }),
    );
    const scale = definedOrThrow(zoneScale({ metric: 'power', thresholds: { ftp: 250 } }));
    const colors = colorsOf(buildZoneColoredPath({ records, metric: 'power', scale }));
    const middle = colors.slice(20, 40);
    for (let channel = 0; channel < 3; channel++) {
      const values = middle.map((c) => c[channel] ?? 0);
      expect(Math.max(...values) - Math.min(...values)).toBeLessThan(20);
    }
  });
});

describe(buildSportColoredPath.name, () => {
  const color: [number, number, number, number] = [74, 222, 128, 255];

  it('returns null for empty records', () => {
    expect(buildSportColoredPath({ records: [], sportColor: color })).toBeNull();
  });

  it('returns null for a single GPS record', () => {
    expect(buildSportColoredPath({ records: [recordAt(1, 2)], sportColor: color })).toBeNull();
  });

  it('returns single color for 2+ valid records', () => {
    const records = [recordAt(10, 20), recordAt(30, 40), recordAt(50, 60)];
    const result = buildSportColoredPath({ records, sportColor: color });
    expect(result).not.toBeNull();
    expect(result?.color).toEqual(color);
    expect(result?.path).toHaveLength(3);
  });

  it('uses [lng, lat] coordinate order', () => {
    const records = [recordAt(10, 20), recordAt(30, 40)];
    const result = buildSportColoredPath({ records, sportColor: color });
    expect(result?.path[0]).toEqual([20, 10]);
    expect(result?.path[1]).toEqual([40, 30]);
  });

  it('filters out records with invalid coordinates', () => {
    const records = [recordAt(10, 20), createMockSessionRecord(), recordAt(30, 40)];
    const result = buildSportColoredPath({ records, sportColor: color });
    expect(result).not.toBeNull();
    expect(result?.path).toHaveLength(2);
  });
});

describe('detail path elevations', () => {
  it('keeps a recorded 0 m as 0 and a missing height as null, aligned with the path', () => {
    const records = [
      createMockSessionRecord({ lat: 49, lng: 8.4, elevation: 0 }),
      createMockSessionRecord({ elevation: 300 }),
      createMockSessionRecord({ lat: 49, lng: 8.41 }),
      createMockSessionRecord({ lat: 49, lng: 8.42, elevation: 12 }),
    ];
    const result = buildSportColoredPath({ records, sportColor: [74, 222, 128, 255] });
    expect(result?.path).toHaveLength(3);
    expect(result?.elevations).toEqual([0, null, 12]);
  });
});
