import { describe, it, expect } from 'vite-plus/test';
import { m } from '@pacevault/i18n/messages.js';
import { fieldErrorFor } from '@/features/settings/hooks/useThresholdsForm.ts';

const values = {
  gender: 'female' as const,
  birthYear: '',
  restHr: '50',
  maxHr: '190',
  thresholdHr: '',
  ftp: '250',
  thresholdPace: '4:30',
  weight: '',
};

describe(fieldErrorFor.name, () => {
  it('rejects an FTP below the range', () => {
    expect(fieldErrorFor({ field: 'ftp', draft: '0', values })).toBe(
      m.ui_thresholds_min_watts({ value: '50' }),
    );
  });

  it('rejects a max HR at or below the rest HR it is paired with', () => {
    expect(
      fieldErrorFor({ field: 'maxHr', draft: '125', values: { ...values, restHr: '125' } }),
    ).toBe(m.ui_thresholds_max_hr_greater());
  });

  it('rejects a rest HR at or above the max HR it is paired with', () => {
    expect(
      fieldErrorFor({ field: 'restHr', draft: '95', values: { ...values, maxHr: '95' } }),
    ).toBe(m.ui_thresholds_rest_hr_less());
  });

  it('rejects a zero threshold pace', () => {
    expect(fieldErrorFor({ field: 'thresholdPace', draft: '0:00', values })).toBe(
      m.ui_thresholds_pace_format(),
    );
  });

  it('accepts a valid value of each field', () => {
    expect(fieldErrorFor({ field: 'ftp', draft: '260', values })).toBe('');
    expect(fieldErrorFor({ field: 'maxHr', draft: '185', values })).toBe('');
    expect(fieldErrorFor({ field: 'restHr', draft: '55', values })).toBe('');
    expect(fieldErrorFor({ field: 'thresholdPace', draft: '4:15', values })).toBe('');
  });
});
