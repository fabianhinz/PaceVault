import { describe, expect, it } from 'vite-plus/test';
import { plotStripTopPx } from '../../../src/components/pvPlotStrip/plotStripScale.ts';

describe(plotStripTopPx.name, () => {
  it('maps the top of the scale below the plot padding', () => {
    expect(plotStripTopPx(0)).toBe(6);
  });

  it('maps the bottom of the scale to the end of the plot span', () => {
    expect(plotStripTopPx(1)).toBe(34);
  });

  it('maps a ratio in between linearly', () => {
    expect(plotStripTopPx(0.5)).toBe(20);
  });
});
