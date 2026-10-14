const HOUR_SEC = 3600;

/** Deterministic Open-Meteo archive response for the requested date range. */
export const openMeteoFixture = (url: URL) => {
  const startSec = Date.parse(`${url.searchParams.get('start_date')}T00:00:00Z`) / 1000;
  const endSec = Date.parse(`${url.searchParams.get('end_date')}T23:00:00Z`) / 1000;
  const time: number[] = [];
  for (let t = startSec; t <= endSec; t += HOUR_SEC) time.push(t);
  const hourOf = (t: number) => Math.floor(t / HOUR_SEC);
  return {
    hourly: {
      time,
      temperature_2m: time.map((t) => 10 + (hourOf(t) % 5)),
      apparent_temperature: time.map((t) => 8 + (hourOf(t) % 5)),
      relative_humidity_2m: time.map(() => 70),
      wind_speed_10m: time.map(() => 18),
      wind_gusts_10m: time.map(() => 30),
      wind_direction_10m: time.map(() => 240),
      weather_code: time.map((t) => (hourOf(t) % 2 === 0 ? 3 : 61)),
    },
  };
};
