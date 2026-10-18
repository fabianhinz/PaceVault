import { describe, it, expect } from 'vite-plus/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseFitFile } from '@/parsers/fit.ts';
import { toFitParseProfile } from '@/lib/fitParseProfile.ts';
import { makeUserProfile } from '@tests/factories/profiles.ts';

const DAY = 86_400_000;

const runningFit = (): ArrayBuffer => {
  const buf = readFileSync(resolve('e2e/fixtures/running.fit'));
  const bytes = new Uint8Array(buf.byteLength);
  bytes.set(buf);
  return bytes.buffer;
};

const fixedProfile = (ftp: number) => () => ({
  restHr: 50,
  maxHr: 190,
  gender: 'male' as const,
  ftp,
});

describe('FIT import with an FTP history', () => {
  it('scores a ride with the FTP in effect on its date', async () => {
    const at200 = await parseFitFile(runningFit(), 'run.fit', fixedProfile(200));
    const at300 = await parseFitFile(runningFit(), 'run.fit', fixedProfile(300));
    const profile = makeUserProfile({
      thresholds: {
        restHr: [{ date: 0, value: 50 }],
        maxHr: [{ date: 0, value: 190 }],
        ftp: [
          { date: 0, value: 200 },
          { date: at200.session.date + DAY, value: 300 },
        ],
      },
    });

    const imported = await parseFitFile(runningFit(), 'run.fit', toFitParseProfile(profile));

    expect(imported.session.stressMethod).toBe('tss');
    expect(imported.session.tss).toBe(at200.session.tss);
    expect(imported.session.tss).not.toBe(at300.session.tss);
  });
});
