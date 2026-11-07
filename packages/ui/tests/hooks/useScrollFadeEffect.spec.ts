import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { act, createElement, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useScrollFadeEffect } from '../../src/hooks/useScrollFadeEffect.ts';

class ResizeObserverStub {
  observe = vi.fn();
  disconnect = vi.fn();
}

const setMetrics = ({
  element,
  metrics,
}: {
  element: HTMLElement;
  metrics: Record<string, number>;
}) => {
  for (const [name, value] of Object.entries(metrics)) {
    Object.defineProperty(element, name, { configurable: true, value });
  }
};

const Probe = (props: { axis?: 'x' | 'y' }) => {
  const ref = useRef<HTMLDivElement>(null);
  useScrollFadeEffect(ref, { axis: props.axis });
  return createElement('div', { ref, 'data-probe': '' });
};

describe(useScrollFadeEffect.name, () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  const probeElement = (): HTMLElement => {
    const element = container.querySelector<HTMLElement>('[data-probe]');
    if (element === null) throw new Error('probe not rendered');
    return element;
  };

  it('sets the left and right attributes on scroll along the x axis', () => {
    act(() => root.render(createElement(Probe, { axis: 'x' })));
    const element = probeElement();
    setMetrics({ element, metrics: { scrollLeft: 300, scrollWidth: 1000, clientWidth: 300 } });
    act(() => {
      element.dispatchEvent(new Event('scroll'));
    });
    expect(element.hasAttribute('data-fade-left')).toBe(true);
    expect(element.hasAttribute('data-fade-right')).toBe(true);
    expect(element.hasAttribute('data-fade-top')).toBe(false);
  });

  it('stays vertical by default', () => {
    act(() => root.render(createElement(Probe)));
    const element = probeElement();
    setMetrics({ element, metrics: { scrollTop: 300, scrollHeight: 1000, clientHeight: 300 } });
    act(() => {
      element.dispatchEvent(new Event('scroll'));
    });
    expect(element.hasAttribute('data-fade-top')).toBe(true);
    expect(element.hasAttribute('data-fade-bottom')).toBe(true);
    expect(element.hasAttribute('data-fade-left')).toBe(false);
  });
});
