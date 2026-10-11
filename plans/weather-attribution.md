# Open-Meteo attribution in the weather card

## Context

- Open-Meteo licence (https://open-meteo.com/en/licence): CC BY 4.0. The credit sits next to where the data is shown, at least "Weather data by Open-Meteo.com", linked to `https://open-meteo.com/`.
- The app has no credit today. Weather data is shown only in `WeatherCard` (`src/features/sessions/session/WeatherCard.tsx`); the expanded part is `WeatherDetails` (wind rose + `WeatherHourlyTable`).
- Existing external link markup: `src/features/intervals/IntervalsConnectionForm.tsx:155-161` (`target="_blank"`, `rel="noreferrer"`, `hover:underline`).

## Changes

- `messages/en.json` / `messages/de.json`: new key `ui_weather_attribution`
  - en: "Weather data by Open-Meteo.com"
  - de: "Wetterdaten von Open-Meteo.com"
- `WeatherCard.tsx` → `WeatherDetails`: last child below `WeatherHourlyTable`, a right-aligned `Typography variant="caption" color="textTertiary"` holding an `<a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="hover:underline">`.
- `e2e/sessions.spec.ts` (weather test, after expanding): `card.getByRole('link', { name: /open-meteo\.com/i })` is visible and has `href` `https://open-meteo.com/`.

## Verification

`vp build` (new message key) → `vp check` → `vp test -- --run` → `vp exec playwright test` → `vp build`.
