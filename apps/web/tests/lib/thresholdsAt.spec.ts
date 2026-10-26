import { describe, it, expect } from 'vite-plus/test';
import { thresholdsAt } from '@/lib/thresholdsAt.ts';
import { createMockUserProfile } from '@tests/factories/profiles.ts';

const march1 = new Date(2026, 2, 1).getTime();
const feb28 = new Date(2026, 1, 28, 18).getTime();
const march1Ride = new Date(2026, 2, 1, 9).getTime();

describe(thresholdsAt.name, () => {
  it('resolves FTP for the session date', () => {
    const profile = createMockUserProfile({
      thresholds: {
        restHr: [{ date: 0, value: 50 }],
        maxHr: [{ date: 0, value: 190 }],
        ftp: [
          { date: 0, value: 250 },
          { date: march1, value: 270 },
        ],
      },
    });
    expect(thresholdsAt({ profile, date: feb28 }).ftp).toBe(250);
    expect(thresholdsAt({ profile, date: march1Ride }).ftp).toBe(270);
  });

  it('leaves FTP undefined without an FTP history', () => {
    const profile = createMockUserProfile({
      thresholds: { restHr: [{ date: 0, value: 50 }], maxHr: [{ date: 0, value: 190 }] },
    });
    expect(thresholdsAt({ profile, date: feb28 })).toMatchObject({
      restHr: 50,
      maxHr: 190,
      ftp: undefined,
    });
  });

  it('derives age from the birth year and the session year', () => {
    const profile = createMockUserProfile({ birthYear: 1992 });
    expect(thresholdsAt({ profile, date: feb28 }).age).toBe(34);
    expect(thresholdsAt({ profile: createMockUserProfile(), date: feb28 }).age).toBeUndefined();
  });
});
