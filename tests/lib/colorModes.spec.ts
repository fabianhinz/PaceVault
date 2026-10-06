import { describe, expect, it } from 'vitest';
import { colorModeStatuses, effectiveColorMode } from '@/lib/colorModes.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';

const records: SessionRecord[] = [
  { timestamp: 0, lat: 48, lng: 11, hr: 140, speed: 3 },
  { timestamp: 1, lat: 48, lng: 11.001, hr: 142, speed: 3 },
];

const ready = { state: 'ready' as const, samples: [{ time: 0, direction: 90 }] };

describe('colorModeStatuses', () => {
  it('explains why a mode is unavailable', () => {
    const statuses = colorModeStatuses({
      sport: 'cycling',
      records,
      thresholds: { maxHr: 190, restHr: 50 },
      wind: { state: 'loading' },
    });
    expect(statuses.hr).toEqual({ available: true });
    expect(statuses.power).toEqual({ available: false, reason: 'noPowerData' });
    expect(statuses.pace).toEqual({ available: false, reason: 'runningOnly' });
    expect(statuses.wind).toEqual({ available: false, reason: 'weatherLoading' });
  });

  it('asks for the missing threshold when the data is there', () => {
    const statuses = colorModeStatuses({ sport: 'running', records, thresholds: {}, wind: ready });
    expect(statuses.hr).toEqual({ available: false, reason: 'hrThresholds' });
    expect(statuses.pace).toEqual({ available: false, reason: 'thresholdPace' });
    expect(statuses.wind).toEqual({ available: true });
  });
});

describe('effectiveColorMode', () => {
  it('shows sport colour while the remembered mode is unavailable for this session', () => {
    const statuses = colorModeStatuses({
      sport: 'running',
      records,
      thresholds: { maxHr: 190, restHr: 50 },
      wind: { state: 'ready', samples: [] },
    });
    expect(effectiveColorMode('wind', statuses)).toBe('sport');
    expect(effectiveColorMode('hr', statuses)).toBe('hr');
  });
});
