import { describe, it, expect } from 'vite-plus/test';
import { fitPadding, MIN_FIT_BOX, PHONE_FIT_MARGIN } from '@/features/map/fitPadding.ts';
import { computeSheetLayout, sheetFitHeight } from '@pacevault/ui/lib/sheetPosition.ts';

const CONTROLS_ROW = 12 + 44;

const lapFit = (viewportHeight: number) => {
  const layout = computeSheetLayout({ viewportHeight, safeTop: 0, safeBottom: 0 });
  const padding = fitPadding({
    canvasHeight: viewportHeight,
    insets: {
      top: 0,
      bottom: sheetFitHeight(layout, 0.5, 0.85) + CONTROLS_ROW,
      left: 0,
      right: 0,
    },
    margin: PHONE_FIT_MARGIN,
  });
  return { padding, box: viewportHeight - padding.top - padding.bottom };
};

describe('fitPadding', () => {
  it('lap fit keeps a visible box on short phones', () => {
    expect(lapFit(520).box).toBe(MIN_FIT_BOX);
    expect(lapFit(548).box).toBe(MIN_FIT_BOX);
  });

  it('leaves an unclamped box on a 664 px phone untouched', () => {
    const fit = lapFit(664);
    expect(fit.box).toBeGreaterThan(MIN_FIT_BOX);
    expect(fit.padding.bottom).toBeCloseTo(
      sheetFitHeight(computeSheetLayout({ viewportHeight: 664, safeTop: 0, safeBottom: 0 }), 0.5) +
        CONTROLS_ROW +
        PHONE_FIT_MARGIN,
    );
  });

  it('never returns a negative bottom when the canvas is shorter than top plus the minimum box', () => {
    const padding = fitPadding({
      canvasHeight: 100,
      insets: { top: 47, bottom: 300, left: 0, right: 0 },
      margin: PHONE_FIT_MARGIN,
    });
    expect(padding.bottom).toBe(0);
    expect(padding.top).toBe(47 + PHONE_FIT_MARGIN);
  });
});
