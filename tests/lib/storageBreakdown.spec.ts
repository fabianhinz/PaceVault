import { describe, it, expect } from 'vitest';
import { breakdownStorage } from '@/lib/storageBreakdown.ts';

describe('breakdownStorage', () => {
  it('groups stores into user-facing categories', () => {
    const categories = breakdownStorage(
      {
        'fit-files': 100,
        'session-records': 300,
        'session-laps': 50,
        'session-gps': 40,
        'session-weather': 5,
        'studio-route-points': 3,
        kv: 2,
      },
      undefined,
    );
    expect(categories).toEqual({
      heatmap: 40,
      fitFiles: 100,
      weather: 5,
      appData: 355,
    });
  });

  it('splits the browser total by the measured shares', () => {
    const categories = breakdownStorage({ 'fit-files': 25, 'session-records': 75 }, 1000);
    expect(categories.fitFiles).toBe(250);
    expect(categories.appData).toBe(750);
    expect(categories.weather).toBe(0);
  });

  it('keeps every category at zero when nothing is stored', () => {
    const categories = breakdownStorage({}, 5000);
    expect(Object.values(categories).every((bytes) => bytes === 0)).toBe(true);
  });
});
