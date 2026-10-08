import { describe, it, expect } from 'vitest';
import { summarizeWeather } from '@/lib/weatherSummary.ts';
import type { WeatherSnapshot } from '@/lib/weather.ts';

const HOUR_MS = 3_600_000;
const START_HOUR = Date.UTC(2026, 9, 4, 8);
const CLEAR = 0;
const CLOUDY = 3;
const LIGHT_RAIN = 61;
const HEAVY_RAIN = 65;

const snapshot = (
  hour: number,
  temperature: number,
  feelsLike: number,
  weatherCode: number,
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
  weatherCode,
});

describe('summarizeWeather', () => {
  it('includes the start hour in the ranges and finds the first condition change', () => {
    const snapshots = [
      snapshot(0, 9, 6, CLOUDY),
      snapshot(1, 14, 13, CLOUDY),
      snapshot(2, 13, 10, HEAVY_RAIN),
      snapshot(3, 15, 12, CLOUDY),
    ];
    const summary = summarizeWeather(snapshots);
    expect(summary?.weatherCode).toBe(CLOUDY);
    expect(summary?.temperature).toEqual({ min: 9, max: 15 });
    expect(summary?.feelsLike).toEqual({ min: 6, max: 13 });
    expect(summary?.windSpeed).toEqual({ min: 20, max: 20 });
    expect(summary?.firstChange).toEqual({
      weatherCode: HEAVY_RAIN,
      time: START_HOUR + 2 * HOUR_MS,
    });
  });

  it('gives no change hint when the condition holds', () => {
    const snapshots = [snapshot(0, 0, -3, CLEAR), snapshot(1, 0, -2, CLEAR)];
    const summary = summarizeWeather(snapshots);
    expect(summary?.firstChange).toBeUndefined();
    expect(summary?.temperature).toEqual({ min: 0, max: 0 });
  });

  it('gives no change hint when only the precipitation intensity changes', () => {
    const snapshots = [snapshot(0, 12, 10, LIGHT_RAIN), snapshot(1, 12, 10, HEAVY_RAIN)];
    expect(summarizeWeather(snapshots)?.firstChange).toBeUndefined();
  });

  it('returns undefined without snapshots', () => {
    expect(summarizeWeather([])).toBeUndefined();
  });
});
