import { describe, it, expect } from 'vitest';
import {
  formatPace,
  formatDate,
  formatDuration,
  formatDistance,
  formatSpeed,
  formatLapTime,
  formatSubSport,
  toDateString,
} from '@/lib/formatters.ts';

describe('formatPace', () => {
  it('300 sec/km => "5:00 /km"', () => {
    expect(formatPace(300)).toBe('5:00 /km');
  });

  it('330 sec/km => "5:30 /km"', () => {
    expect(formatPace(330)).toBe('5:30 /km');
  });

  it('270 sec/km => "4:30 /km"', () => {
    expect(formatPace(270)).toBe('4:30 /km');
  });

  it('pads single-digit seconds: 61 sec/km => "1:01 /km"', () => {
    expect(formatPace(61)).toBe('1:01 /km');
  });

  it('0 sec/km => "0:00 /km"', () => {
    expect(formatPace(0)).toBe('0:00 /km');
  });
});

describe('formatDate', () => {
  it('formats a known timestamp correctly', () => {
    const ts = new Date('2024-06-15T00:00:00').getTime();
    expect(formatDate(ts)).toBe('Jun 15, 2024');
  });

  it('formats end-of-year date', () => {
    const ts = new Date('2024-12-31T00:00:00').getTime();
    expect(formatDate(ts)).toBe('Dec 31, 2024');
  });

  it('formats start-of-year date', () => {
    const ts = new Date('2024-01-01T00:00:00').getTime();
    expect(formatDate(ts)).toBe('Jan 1, 2024');
  });
});

describe('formatDuration', () => {
  it('3600 seconds => "1h 0m"', () => {
    expect(formatDuration(3600)).toBe('1h 0m');
  });

  it('3661 seconds => "1h 1m"', () => {
    expect(formatDuration(3661)).toBe('1h 1m');
  });

  it('90 seconds => "1m 30s"', () => {
    expect(formatDuration(90)).toBe('1m 30s');
  });

  it('45 seconds => "45s"', () => {
    expect(formatDuration(45)).toBe('45s');
  });

  it('0 seconds => "0s"', () => {
    expect(formatDuration(0)).toBe('0s');
  });

  it('7200 seconds => "2h 0m"', () => {
    expect(formatDuration(7200)).toBe('2h 0m');
  });
});

describe('formatDistance', () => {
  it('1500 meters => "1.5 km"', () => {
    expect(formatDistance(1500)).toBe('1.5 km');
  });

  it('999 meters => "999 m"', () => {
    expect(formatDistance(999)).toBe('999 m');
  });

  it('1000 meters => "1.0 km"', () => {
    expect(formatDistance(1000)).toBe('1.0 km');
  });

  it('42195 meters => "42.2 km"', () => {
    expect(formatDistance(42195)).toBe('42.2 km');
  });

  it('0 meters => "0 m"', () => {
    expect(formatDistance(0)).toBe('0 m');
  });
});

describe('formatSpeed', () => {
  it('1 m/s => "3.6 km/h"', () => {
    expect(formatSpeed(1)).toBe('3.6 km/h');
  });

  it('10 m/s => "36.0 km/h"', () => {
    expect(formatSpeed(10)).toBe('36.0 km/h');
  });

  it('0 m/s => "0.0 km/h"', () => {
    expect(formatSpeed(0)).toBe('0.0 km/h');
  });
});

describe('formatLapTime', () => {
  it('300 seconds => "5:00"', () => {
    expect(formatLapTime(300)).toBe('5:00');
  });

  it('61 seconds => "1:01"', () => {
    expect(formatLapTime(61)).toBe('1:01');
  });

  it('0 seconds => "0:00"', () => {
    expect(formatLapTime(0)).toBe('0:00');
  });
});

describe('formatSubSport', () => {
  it('"road" => "Road"', () => {
    expect(formatSubSport('road')).toBe('Road');
  });

  it('"trail" => "Trail"', () => {
    expect(formatSubSport('trail')).toBe('Trail');
  });

  it('"virtual_activity" => "Virtual"', () => {
    expect(formatSubSport('virtual_activity')).toBe('Virtual');
  });

  it('"indoor_cycling" => "Indoor"', () => {
    expect(formatSubSport('indoor_cycling')).toBe('Indoor');
  });

  it('"gravel_cycling" => "Gravel"', () => {
    expect(formatSubSport('gravel_cycling')).toBe('Gravel');
  });

  it('"treadmill" => "Treadmill"', () => {
    expect(formatSubSport('treadmill')).toBe('Treadmill');
  });

  it('unknown sub-sport falls back to title-cased: "open_water" => "Open Water"', () => {
    expect(formatSubSport('open_water')).toBe('Open Water');
  });
});

describe('toDateString', () => {
  it('returns the local date in YYYY-MM-DD format', () => {
    const d = new Date(2024, 5, 15, 23, 30); // June 15, 11:30 PM local
    expect(toDateString(d.getTime())).toBe('2024-06-15');
  });

  it('does not shift to next day for late-night local timestamps', () => {
    const d = new Date(2024, 11, 31, 23, 59); // Dec 31, 11:59 PM local
    expect(toDateString(d.getTime())).toBe('2024-12-31');
  });
});
