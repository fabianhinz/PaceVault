import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { act, createElement, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useScrollToEndEffect } from '../../src/hooks/useScrollToEndEffect.ts';

const SCROLL_WIDTH_PX = 900;

const Probe = (props: { scrollKey: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  useScrollToEndEffect({ ref, scrollKey: props.scrollKey });
  return createElement('div', { ref, 'data-probe': '' });
};

describe(useScrollToEndEffect.name, () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get: () => SCROLL_WIDTH_PX,
    });
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollWidth');
    vi.unstubAllGlobals();
  });

  const probeElement = (): HTMLElement => {
    const element = container.querySelector<HTMLElement>('[data-probe]');
    if (element === null) throw new Error('probe not rendered');
    return element;
  };

  it('scrolls to the end on mount', () => {
    act(() => root.render(createElement(Probe, { scrollKey: 'a' })));

    expect(probeElement().scrollLeft).toBe(SCROLL_WIDTH_PX);
  });

  it('scrolls to the end again when the key changes', () => {
    act(() => root.render(createElement(Probe, { scrollKey: 'a' })));
    probeElement().scrollLeft = 0;

    act(() => root.render(createElement(Probe, { scrollKey: 'b' })));

    expect(probeElement().scrollLeft).toBe(SCROLL_WIDTH_PX);
  });

  it('keeps the position while the key stays', () => {
    act(() => root.render(createElement(Probe, { scrollKey: 'a' })));
    probeElement().scrollLeft = 0;

    act(() => root.render(createElement(Probe, { scrollKey: 'a' })));

    expect(probeElement().scrollLeft).toBe(0);
  });
});
