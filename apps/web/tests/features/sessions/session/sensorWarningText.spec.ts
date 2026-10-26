import { describe, it, expect } from 'vite-plus/test';
import { validateRecords } from '@/lib/validation.ts';
import { sensorWarningText } from '@/features/sessions/session/sensorWarningText.ts';
import { importInLocale } from '@testUtils/locale.ts';
import type { SessionRecord } from '@pacevault/engine/types.ts';

const faultyRecords = (): SessionRecord[] =>
  Array.from({ length: 14 }, (_, i) => ({ timestamp: i, hr: 240, power: 3000 }));

describe(sensorWarningText.name, () => {
  it('sensor warnings stay English in the German UI', async () => {
    const german = await importInLocale(
      'de',
      () => import('@/features/sessions/session/sensorWarningText.ts'),
    );

    const warnings = validateRecords({ records: faultyRecords(), sport: 'cycling' });

    expect(warnings.map((w) => w.code)).toEqual(['hr_above_max', 'power_above_max']);
    expect(warnings.map(german.sensorWarningText)).toEqual([
      'Herzfrequenz über 230 bpm in 14 Messpunkten – wahrscheinlich Sensorfehler',
      'Leistung über 2.500 W in 14 Messpunkten – wahrscheinlich Sensorfehler',
    ]);
  });
});
