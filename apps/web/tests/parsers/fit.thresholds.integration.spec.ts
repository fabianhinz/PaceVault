import { describe, it, expect } from 'vite-plus/test';
import { readE2eFixture } from '@testUtils/fixtures.ts';
import { parseFitFile } from '@/parsers/fit.ts';
import { toFitParseProfile } from '@/parsers/fitParseProfile.ts';
import { createMockUserProfile } from '@tests/factories/profiles.ts';
import { MS_PER_DAY } from '@pacevault/engine/time.ts';

const fixedProfile = (ftp: number) => () => ({
  restHr: 50,
  maxHr: 190,
  gender: 'male' as const,
  ftp,
});

describe('FIT import with an FTP history', () => {
  it('scores a run from heart rate, not from its power, whatever the FTP', async () => {
    const at200 = await parseFitFile({
      arrayBuffer: readE2eFixture('running.fit'),
      fileName: 'run.fit',
      profileAt: fixedProfile(200),
    });
    const at300 = await parseFitFile({
      arrayBuffer: readE2eFixture('running.fit'),
      fileName: 'run.fit',
      profileAt: fixedProfile(300),
    });
    const profile = createMockUserProfile({
      thresholds: {
        restHr: [{ date: 0, value: 50 }],
        maxHr: [{ date: 0, value: 190 }],
        ftp: [
          { date: 0, value: 200 },
          { date: at200.session.date + MS_PER_DAY, value: 300 },
        ],
      },
    });

    const imported = await parseFitFile({
      arrayBuffer: readE2eFixture('running.fit'),
      fileName: 'run.fit',
      profileAt: toFitParseProfile(profile),
    });

    expect(imported.session.normalizedPower).toBeDefined();
    expect(imported.session.stressMethod).toBe('trimp');
    expect(imported.session.tss).toBe(at200.session.tss);
    expect(imported.session.tss).toBe(at300.session.tss);
  });
});
