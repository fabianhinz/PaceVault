import { describe, it, expect } from 'vitest';
import { formatSessionName, formatSessionZoneLabel } from '@/lib/sessionTitleFormatter.ts';

const atHour = (hour: number): number => new Date(2025, 0, 15, hour, 0, 0).getTime();

describe('formatSessionName', () => {
  it('returns the name when available', () => {
    expect(formatSessionName({ sport: 'running', date: atHour(8), name: 'My Custom Name' })).toBe(
      'My Custom Name',
    );
  });

  it('falls back to sport and time of day when the name is missing', () => {
    expect(formatSessionName({ sport: 'running', date: atHour(5) })).toBe('Morning Run');
    expect(formatSessionName({ sport: 'cycling', date: atHour(21) })).toBe('Night Ride');
  });

  it('prefixes a mapped sub-sport in the fallback', () => {
    expect(formatSessionName({ sport: 'running', subSport: 'trail', date: atHour(12) })).toBe(
      'Afternoon Trail Run',
    );
    expect(formatSessionName({ sport: 'running', subSport: 'road', date: atHour(17) })).toBe(
      'Evening Run',
    );
  });
});

describe('formatSessionZoneLabel', () => {
  it('returns correct zone for valid input', () => {
    expect(formatSessionZoneLabel(160, 200, 50)).toBe('Tempo');
  });

  it('returns undefined when input is missing', () => {
    expect(formatSessionZoneLabel(undefined, 200, 50)).toBeUndefined();
  });

  it('returns undefined when maxHr <= restHr', () => {
    expect(formatSessionZoneLabel(150, 50, 60)).toBeUndefined();
  });
});
