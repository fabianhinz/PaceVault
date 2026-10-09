import { describe, it, expect } from 'vitest';
import {
  computeSheetLayout,
  offsetToPosition,
  positionToOffset,
  settlePosition,
  sheetFitHeight,
  sheetTapTarget,
} from '@/lib/sheetPosition.ts';

const layout = computeSheetLayout({
  viewportHeight: 844,
  safeTop: 47,
  safeBottom: 34,
});

describe('sheet position', () => {
  it('maps peek to the lowest offset and full to the top', () => {
    expect(positionToOffset(layout, 0)).toBe(layout.peekOffset);
    expect(positionToOffset(layout, 1)).toBe(0);
  });

  it('round-trips a dragged offset back to the same position', () => {
    const offset = layout.peekOffset * 0.3;
    expect(offsetToPosition(layout, offset)).toBeCloseTo(0.7);
  });

  it('clamps offsets past either end', () => {
    expect(offsetToPosition(layout, layout.peekOffset + 80)).toBe(0);
    expect(offsetToPosition(layout, -40)).toBe(1);
  });

  it('settles a release inside the fade zone on the more visible layer', () => {
    expect(settlePosition(0.05)).toBe(0);
    expect(settlePosition(0.1)).toBe(0.15);
  });

  it('leaves a release outside the fade zone where it stopped', () => {
    expect(settlePosition(0)).toBe(0);
    expect(settlePosition(0.15)).toBe(0.15);
    expect(settlePosition(0.6)).toBe(0.6);
  });
  it('taps toward the farther end', () => {
    expect(sheetTapTarget(0)).toBe(1);
    expect(sheetTapTarget(0.5)).toBe(1);
    expect(sheetTapTarget(0.51)).toBe(0);
    expect(sheetTapTarget(1)).toBe(0);
  });

  it('fits the map above the middle snap point while the sheet is dragged higher', () => {
    const middle = sheetFitHeight(layout, 0.5);
    expect(sheetFitHeight(layout, 0.8)).toBe(middle);
    expect(sheetFitHeight(layout, 1)).toBe(middle);
  });

  it('keeps the peek above the floating dock row, with and without a home indicator', () => {
    expect(layout.bottomInset).toBe(28 + 52 + 8);
    const flat = computeSheetLayout({ viewportHeight: 844, safeTop: 0, safeBottom: 0 });
    expect(flat.bottomInset).toBe(12 + 52 + 8);
  });

  it('fits the map above the real sheet while it sits below the middle', () => {
    expect(sheetFitHeight(layout, 0)).toBe(layout.sheetHeight - layout.peekOffset);
    expect(sheetFitHeight(layout, 0.25)).toBeLessThan(sheetFitHeight(layout, 0.5));
  });
});
