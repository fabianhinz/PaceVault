import { describe, expect, it } from 'vite-plus/test';
import { lapsRowLabels } from '@/components/sessions/session/lapLabels.ts';

describe(lapsRowLabels.name, () => {
  it('disables the laps row when splits are chosen but the session has no distance data', () => {
    expect(lapsRowLabels({ source: 'splits', set: null, sport: 'running' })).toEqual({
      disabled: true,
      primary: 'Splits unavailable',
      secondary: 'This session has no distance data',
    });
  });
});
