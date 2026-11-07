import { useEffect, type RefObject } from 'react';
import { horizontalScrollFadeEdges, scrollFadeEdges } from '../lib/scrollFade.ts';

type ScrollFadeAxis = 'y' | 'x';

const toggleAttribute = ({
  element,
  name,
  on,
}: {
  element: HTMLElement;
  name: string;
  on: boolean;
}) => {
  if (on) {
    element.setAttribute(name, '');
  } else {
    element.removeAttribute(name);
  }
};

const updateEdges = ({ element, axis }: { element: HTMLElement; axis: ScrollFadeAxis }) => {
  if (axis === 'x') {
    const edges = horizontalScrollFadeEdges(element);
    toggleAttribute({ element, name: 'data-fade-left', on: edges.left });
    toggleAttribute({ element, name: 'data-fade-right', on: edges.right });
    return;
  }
  const edges = scrollFadeEdges(element);
  toggleAttribute({ element, name: 'data-fade-top', on: edges.top });
  toggleAttribute({ element, name: 'data-fade-bottom', on: edges.bottom });
};

export const useScrollFadeEffect = (
  ref: RefObject<HTMLElement | null>,
  options?: { axis?: ScrollFadeAxis },
): void => {
  const axis = options?.axis ?? 'y';
  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const update = () => updateEdges({ element, axis });
    const observeChildren = (observer: ResizeObserver) => {
      for (const child of element.children) {
        observer.observe(child);
      }
    };
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(element);
    observeChildren(resizeObserver);
    const mutationObserver = new MutationObserver(() => {
      resizeObserver.disconnect();
      resizeObserver.observe(element);
      observeChildren(resizeObserver);
      update();
    });
    mutationObserver.observe(element, { childList: true });
    element.addEventListener('scroll', update, { passive: true });
    update();
    return () => {
      element.removeEventListener('scroll', update);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [ref, axis]);
};
