---
title: Weather hour highlight
status: idea
created: 2026-10-23
type: feature
areas: [app]
next: 'Owner answers Q1, then explore or plan'
size: small
---

# Highlight the matching weather hour when hovering charts or laps

## Idea

Hovering a chart or a lap highlights the matching time span with a band (lap bands, `apps/web/src/components/charts/LapBands.tsx`). The hourly weather table (`apps/web/src/features/sessions/session/WeatherHourlyTable.tsx:74`, in the weather card) gets a similar highlighter: the hour column under the chart cursor or the hovered lap stands out. Owner: "when hovering laps / charts we get those bands. Would be super cool to have a similar highlighter for the weather."

## Open questions

- **Q1** · open · Which direction? (a) charts and laps → weather: the hour column of the chart cursor (or the hours a hovered/selected lap spans) is highlighted (b) both ways: hovering an hour column also draws a band over that hour in the charts and the map (c) only weather → charts.
