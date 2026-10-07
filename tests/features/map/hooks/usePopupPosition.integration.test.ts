import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePopupPosition } from '@/features/map/hooks/usePopupPosition.ts';

const VIEWPORT = { width: 900, height: 800 };
const DOCK_TOP = 740;
const POPUP_HEIGHT = 300;

const stubTabletViewport = () => {
  vi.stubGlobal('innerWidth', VIEWPORT.width);
  vi.stubGlobal('innerHeight', VIEWPORT.height);
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => {
      const minWidth = Number(/min-width:\s*(\d+)px/.exec(query)?.[1] ?? 0);
      return {
        matches: VIEWPORT.width >= minWidth,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
    }),
  );
  const dock = document.createElement('div');
  dock.dataset.layout = 'dock';
  dock.getBoundingClientRect = () =>
    DOMRect.fromRect({ x: 0, y: DOCK_TOP, width: VIEWPORT.width, height: 60 });
  document.body.append(dock);
};

describe('usePopupPosition', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.replaceChildren();
  });

  it('keeps the popup above the bottom dock between 768 and 1024 px, where the phone layout shows', () => {
    stubTabletViewport();
    const { result } = renderHook(() => usePopupPosition(450, 440));
    expect(Number(result.current.top) + POPUP_HEIGHT).toBeLessThan(DOCK_TOP);
  });
});
