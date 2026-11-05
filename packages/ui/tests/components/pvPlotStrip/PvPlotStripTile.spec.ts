import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { act, createElement, type ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Crown } from 'lucide-react';
import { PvPlotStripTile } from '../../../src/components/pvPlotStrip/PvPlotStripTile.tsx';

type PlotStripTileProps = ComponentProps<typeof PvPlotStripTile>;

describe(PvPlotStripTile.name, () => {
  let container: HTMLDivElement;
  let root: Root;
  let onPress: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    onPress = vi.fn<() => void>();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  const renderChip = (overrides: Partial<PlotStripTileProps>): HTMLButtonElement => {
    act(() =>
      root.render(
        createElement(PvPlotStripTile, {
          label: '3 Oct',
          accessibleLabel: '3 Oct 2026',
          position: { ratio: 0.5, clamped: false },
          pressed: false,
          onPress,
          ...overrides,
        }),
      ),
    );
    const button = container.querySelector('button');
    if (button === null) throw new Error('chip not rendered');
    return button;
  };

  const markerOf = (button: HTMLButtonElement): string | null =>
    button.querySelector('[data-marker]')?.getAttribute('data-marker') ?? null;

  it('draws a dot for a pass inside the scale', () => {
    expect(markerOf(renderChip({}))).toBe('dot');
  });

  it('draws the outlier mark for a pass beyond the scale', () => {
    expect(markerOf(renderChip({ position: { ratio: 1, clamped: true } }))).toBe('outlier');
  });

  it('draws the marker icon in place of the dot', () => {
    expect(markerOf(renderChip({ markerIcon: Crown, tone: 'best' }))).toBe('icon');
  });

  it('presses an idle chip', () => {
    const button = renderChip({});

    act(() => button.click());

    expect(onPress).toHaveBeenCalledWith();
  });

  it('ignores a press on the pressed chip', () => {
    const button = renderChip({ pressed: true });

    act(() => button.click());

    expect(onPress).not.toHaveBeenCalled();
    expect(button).toHaveProperty('ariaPressed', 'true');
  });
});
