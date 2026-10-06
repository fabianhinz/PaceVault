import { describe, it, expect } from 'vitest';
import { conditionChangeIndices, summarizeWeather } from '@/lib/weatherSummary.ts';
import type { WeatherCondition, WeatherSnapshot } from '@/lib/weather.ts';

const HOUR_MS = 3_600_000;
const START_HOUR = Date.UTC(2026, 9, 4, 8);

const snapshot = (
  hour: number,
  temperature: number,
  feelsLike: number,
  condition: WeatherCondition,
): WeatherSnapshot => ({
  time: START_HOUR + hour * HOUR_MS,
  lat: 48,
  lng: 11,
  temperature,
  feelsLike,
  humidity: 70,
  windSpeed: 20,
  windGusts: 30,
  windDirection: 240,
  weatherCode: 3,
  condition,
});

describe('summarizeWeather', () => {
  it('includes the start hour in the ranges and finds the first condition change', () => {
    const snapshots = [
      snapshot(0, 9, 6, 'cloudy'),
      snapshot(1, 14, 13, 'cloudy'),
      snapshot(2, 13, 10, 'rain'),
      snapshot(3, 15, 12, 'cloudy'),
    ];
    const summary = summarizeWeather(snapshots);
    expect(summary?.condition).toBe('cloudy');
    expect(summary?.temperature).toEqual({ min: 9, max: 15 });
    expect(summary?.feelsLike).toEqual({ min: 6, max: 13 });
    expect(summary?.firstChange).toEqual({ condition: 'rain', time: START_HOUR + 2 * HOUR_MS });
    expect([...conditionChangeIndices(snapshots)]).toEqual([2, 3]);
  });

  it('gives no change hint when the condition holds', () => {
    const snapshots = [snapshot(0, 0, -3, 'clear'), snapshot(1, 0, -2, 'clear')];
    const summary = summarizeWeather(snapshots);
    expect(summary?.firstChange).toBeUndefined();
    expect(summary?.temperature).toEqual({ min: 0, max: 0 });
    expect(conditionChangeIndices(snapshots).size).toBe(0);
  });

  it('returns undefined without snapshots', () => {
    expect(summarizeWeather([])).toBeUndefined();
  });
});
