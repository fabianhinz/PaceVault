import { wmoToCondition, type WeatherSnapshot } from '@/lib/weather.ts';

export interface ValueRange {
  min: number;
  max: number;
}

interface ConditionChange {
  weatherCode: number;
  time: number;
}

export interface WeatherSummary {
  weatherCode: number;
  temperature: ValueRange;
  feelsLike: ValueRange;
  windSpeed: ValueRange;
  firstChange: ConditionChange | undefined;
}

const rangeOf = (values: number[]): ValueRange => ({
  min: Math.min(...values),
  max: Math.max(...values),
});

export const summarizeWeather = (snapshots: WeatherSnapshot[]): WeatherSummary | undefined => {
  const first = snapshots[0];
  if (first === undefined) return undefined;

  const firstCondition = wmoToCondition(first.weatherCode);
  let firstChange: ConditionChange | undefined;
  const changed = snapshots.find(
    (snapshot) => wmoToCondition(snapshot.weatherCode) !== firstCondition,
  );
  if (changed !== undefined) {
    firstChange = { weatherCode: changed.weatherCode, time: changed.time };
  }

  return {
    weatherCode: first.weatherCode,
    temperature: rangeOf(snapshots.map((snapshot) => snapshot.temperature)),
    feelsLike: rangeOf(snapshots.map((snapshot) => snapshot.feelsLike)),
    windSpeed: rangeOf(snapshots.map((snapshot) => snapshot.windSpeed)),
    firstChange,
  };
};
