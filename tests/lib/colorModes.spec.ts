import { describe, expect, it } from 'vitest';
import { colorModeOptions, effectiveColorMode, type ColorModeOption } from '@/lib/colorModes.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';

const records: SessionRecord[] = [
  { timestamp: 0, lat: 48, lng: 11, hr: 140, speed: 3 },
  { timestamp: 1, lat: 48, lng: 11.001, hr: 142, speed: 3 },
];

const ready = { state: 'ready' as const, samples: [{ time: 0, direction: 90 }] };

const statusOf = (options: ColorModeOption[], mode: ColorModeOption['mode']) =>
  options.find((option) => option.mode === mode)?.status;

describe('colorModeOptions', () => {
  it('explains why a mode is unavailable', () => {
    const options = colorModeOptions({
      sport: 'cycling',
      records,
      thresholds: { maxHr: 190, restHr: 50 },
      wind: { state: 'loading' },
    });
    expect(statusOf(options, 'hr')).toEqual({ available: true });
    expect(statusOf(options, 'power')).toEqual({ available: false, reason: 'noPowerData' });
    expect(statusOf(options, 'wind')).toEqual({ available: false, reason: 'weatherLoading' });
  });

  it('asks for the missing threshold when the data is there', () => {
    const options = colorModeOptions({ sport: 'running', records, thresholds: {}, wind: ready });
    expect(statusOf(options, 'hr')).toEqual({ available: false, reason: 'hrThresholds' });
    expect(statusOf(options, 'pace')).toEqual({ available: false, reason: 'thresholdPace' });
    expect(statusOf(options, 'wind')).toEqual({ available: true });
  });

  it('offers speed instead of pace on a ride, without any threshold', () => {
    const ride = colorModeOptions({ sport: 'cycling', records, thresholds: {}, wind: ready });
    expect(ride.map((option) => option.mode)).toEqual(['sport', 'hr', 'power', 'speed', 'wind']);
    expect(statusOf(ride, 'speed')).toEqual({ available: true });

    const run = colorModeOptions({ sport: 'running', records, thresholds: {}, wind: ready });
    expect(run.map((option) => option.mode)).toEqual(['sport', 'hr', 'power', 'pace', 'wind']);
  });

  it('makes speed unavailable on a ride without moving speed', () => {
    const stationary: SessionRecord[] = [
      { timestamp: 0, hr: 140 },
      { timestamp: 1, hr: 142, speed: 0 },
    ];
    const options = colorModeOptions({
      sport: 'cycling',
      records: stationary,
      thresholds: {},
      wind: ready,
    });
    expect(statusOf(options, 'speed')).toEqual({ available: false, reason: 'noSpeedData' });
  });
});

describe('effectiveColorMode', () => {
  it('shows sport colour while the remembered mode is unavailable for this session', () => {
    const options = colorModeOptions({
      sport: 'running',
      records,
      thresholds: { maxHr: 190, restHr: 50 },
      wind: { state: 'ready', samples: [] },
    });
    expect(effectiveColorMode('wind', options)).toBe('sport');
    expect(effectiveColorMode('hr', options)).toBe('hr');
    expect(effectiveColorMode('speed', options)).toBe('sport');
  });
});
