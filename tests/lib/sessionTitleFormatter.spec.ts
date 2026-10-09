import { describe, it, expect } from 'vitest';
import { formatSessionName, formatSessionZoneLabel } from '@/lib/sessionTitleFormatter.ts';

const atHour = (hour: number): number => new Date(2025, 0, 15, hour, 0, 0).getTime();

describe('formatSessionName', () => {
  it('returns name when available', () => {
    expect(formatSessionName({ date: atHour(8), name: 'My Custom Name' })).toBe('My Custom Name');
  });

  it('falls back to formatted date when name is missing', () => {
    const result = formatSessionName({ date: atHour(8) });
    expect(result).toBeTruthy();
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
