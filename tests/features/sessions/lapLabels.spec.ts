import { describe, expect, it } from 'vitest';
import { lapsRowLabels } from '@/features/sessions/session/lapLabels.ts';

describe('lapsRowLabels', () => {
  it('disables the laps row when splits are chosen but the session has no distance data', () => {
    expect(lapsRowLabels('splits', null, 'running')).toEqual({
      disabled: true,
      primary: 'Splits unavailable',
      secondary: 'This session has no distance data',
    });
  });
});
