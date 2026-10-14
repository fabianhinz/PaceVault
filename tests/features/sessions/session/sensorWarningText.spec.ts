import { describe, it, expect, afterEach } from 'vitest';
import { validateRecords } from '@/lib/validation.ts';
import { sensorWarningText } from '@/features/sessions/session/sensorWarningText.ts';
import { overwriteGetLocale } from '@/paraglide/runtime.js';
import type { SessionRecord } from '@/packages/engine/types.ts';

const faultyRecords = (): SessionRecord[] =>
  Array.from({ length: 14 }, (_, i) => ({ timestamp: i, hr: 240, power: 3000 }));

describe('sensorWarningText', () => {
  afterEach(() => {
    overwriteGetLocale(() => 'en');
  });

  it('sensor warnings stay English in the German UI', () => {
    overwriteGetLocale(() => 'de');

    const warnings = validateRecords(faultyRecords(), 'cycling');

    expect(warnings.map((w) => w.code)).toEqual(['hr_above_max', 'power_above_max']);
    expect(warnings.map(sensorWarningText)).toEqual([
      'Herzfrequenz über 230 bpm in 14 Messpunkten – wahrscheinlich Sensorfehler',
      'Leistung über 2.500 W in 14 Messpunkten – wahrscheinlich Sensorfehler',
    ]);
  });
});
