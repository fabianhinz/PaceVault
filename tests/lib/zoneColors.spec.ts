import { describe, expect, it } from 'vitest';
import { zoneLineStroke, zoneScale, type ZoneScale } from '@/lib/zoneColors.ts';

const hr = zoneScale('hr', { maxHr: 200, restHr: 60 }) as ZoneScale;

describe('zoneScale', () => {
  it('is unavailable without the thresholds a metric needs', () => {
    expect(zoneScale('hr', { maxHr: 60, restHr: 60 })).toBeUndefined();
    expect(zoneScale('power', {})).toBeUndefined();
    expect(zoneScale('pace', { thresholdPace: 0 })).toBeUndefined();
  });

  it('labels values outside every zone with the nearest zone', () => {
    expect(hr.bandAt(0).zone).toBe('Z1');
    expect(hr.bandAt(250).zone).toBe('Z5');
    const pace = zoneScale('pace', { thresholdPace: 270 }) as ZoneScale;
    expect(pace.bandAt(3).name).toBe('vo2max');
    expect(pace.bandAt(9).name).toBe('recovery');
  });
});

describe('zoneLineStroke', () => {
  it('chart gradient uses the same blended colours as the map track', () => {
    const line = zoneLineStroke(hr, [120, 180], false, 'g');
    expect(line?.stroke).toBe('url(#g)');
    const top = line?.stops?.[0];
    const bottom = line?.stops?.[line.stops.length - 1];
    expect(top).toEqual({ offset: 0, color: hr.colorAt(180) });
    expect(bottom).toEqual({ offset: 1, color: hr.colorAt(120) });
  });

  it('puts the smallest value on top for the reversed pace axis', () => {
    const pace = zoneScale('pace', { thresholdPace: 270 }) as ZoneScale;
    const stops = zoneLineStroke(pace, [4, 6], true, 'g')?.stops;
    expect(stops?.[0]).toEqual({ offset: 0, color: pace.colorAt(4) });
  });

  it('falls back to a solid colour when all values are equal', () => {
    expect(zoneLineStroke(hr, [150, null, 150], false, 'g')).toEqual({ stroke: hr.colorAt(150) });
  });
});
