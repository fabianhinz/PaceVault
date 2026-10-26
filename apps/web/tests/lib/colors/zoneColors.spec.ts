import { describe, expect, it } from 'vite-plus/test';
import { PALETTE_BY_ZONE_METRIC, zoneLineStroke, zoneScale } from '@/lib/colors/zoneColors.ts';
import { definedOrThrow } from '@testUtils/defined.ts';

const hr = definedOrThrow(zoneScale({ metric: 'hr', thresholds: { maxHr: 200, restHr: 60 } }));

describe(zoneScale.name, () => {
  it('is unavailable without the thresholds a metric needs', () => {
    expect(zoneScale({ metric: 'hr', thresholds: { maxHr: 60, restHr: 60 } })).toBeUndefined();
    expect(zoneScale({ metric: 'power', thresholds: {} })).toBeUndefined();
    expect(zoneScale({ metric: 'pace', thresholds: { thresholdPace: 0 } })).toBeUndefined();
  });

  it('labels values outside every zone with the nearest zone', () => {
    expect(hr.bandAt(0).zone).toBe('Z1');
    expect(hr.bandAt(250).zone).toBe('Z5');
    const pace = definedOrThrow(zoneScale({ metric: 'pace', thresholds: { thresholdPace: 270 } }));
    expect(pace.bandAt(3).name).toBe('vo2max');
    expect(pace.bandAt(9).name).toBe('recovery');
  });
});

describe(zoneLineStroke.name, () => {
  it('chart gradient uses the same blended colours as the map track', () => {
    const line = zoneLineStroke({
      scale: hr,
      values: [120, 180],
      reversed: false,
      gradientId: 'g',
    });
    expect(line?.stroke).toBe('url(#g)');
    const top = line?.stops?.[0];
    const bottom = line?.stops?.[line.stops.length - 1];
    expect(top).toEqual({ offset: 0, color: hr.colorAt(180) });
    expect(bottom).toEqual({ offset: 1, color: hr.colorAt(120) });
  });

  it('puts the smallest value on top for the reversed pace axis', () => {
    const pace = definedOrThrow(zoneScale({ metric: 'pace', thresholds: { thresholdPace: 270 } }));
    const stops = zoneLineStroke({
      scale: pace,
      values: [4, 6],
      reversed: true,
      gradientId: 'g',
    })?.stops;
    expect(stops?.[0]).toEqual({ offset: 0, color: pace.colorAt(4) });
  });

  it('falls back to a solid colour when all values are equal', () => {
    expect(
      zoneLineStroke({ scale: hr, values: [150, null, 150], reversed: false, gradientId: 'g' }),
    ).toEqual({ stroke: hr.colorAt(150) });
  });
});

describe('PALETTE_BY_ZONE_METRIC', () => {
  it('lists the pace zone colours from recovery to VO2max', () => {
    expect(PALETTE_BY_ZONE_METRIC.pace).toEqual([
      '#60a5fa',
      '#34d399',
      '#fbbf24',
      '#f97316',
      '#ef4444',
    ]);
  });

  it('lists the heart-rate zone colours from Z1 to Z5', () => {
    expect(PALETTE_BY_ZONE_METRIC.hr).toEqual([
      '#60a5fa',
      '#34d399',
      '#fbbf24',
      '#f97316',
      '#ef4444',
    ]);
  });

  it('lists the power zone colours from Z1 to Z7', () => {
    expect(PALETTE_BY_ZONE_METRIC.power).toEqual([
      '#94a3b8',
      '#60a5fa',
      '#34d399',
      '#fbbf24',
      '#f97316',
      '#ef4444',
      '#dc2626',
    ]);
  });
});
