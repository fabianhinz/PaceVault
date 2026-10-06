import type { WeatherCondition, WeatherSnapshot } from '@/lib/weather.ts';

export interface ValueRange {
  min: number;
  max: number;
}

export interface ConditionChange {
  condition: WeatherCondition;
  time: number;
}

export interface WeatherSummary {
  condition: WeatherCondition;
  temperature: ValueRange;
  feelsLike: ValueRange;
  firstChange: ConditionChange | undefined;
}

const rangeOf = (values: number[]): ValueRange => ({
  min: Math.min(...values),
  max: Math.max(...values),
});

export const conditionChangeIndices = (snapshots: WeatherSnapshot[]): Set<number> => {
  const indices = new Set<number>();
  for (let i = 1; i < snapshots.length; i++) {
    if (snapshots[i]?.condition !== snapshots[i - 1]?.condition) {
      indices.add(i);
    }
  }
  return indices;
};

export const summarizeWeather = (snapshots: WeatherSnapshot[]): WeatherSummary | undefined => {
  const first = snapshots[0];
  if (first === undefined) return undefined;

  let firstChange: ConditionChange | undefined;
  const changed = snapshots.find((snapshot) => snapshot.condition !== first.condition);
  if (changed !== undefined) {
    firstChange = { condition: changed.condition, time: changed.time };
  }

  return {
    condition: first.condition,
    temperature: rangeOf(snapshots.map((snapshot) => snapshot.temperature)),
    feelsLike: rangeOf(snapshots.map((snapshot) => snapshot.feelsLike)),
    firstChange,
  };
};
