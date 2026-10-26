import { useEffect, type RefObject } from 'react';
import { scrollFadeEdges } from '../lib/scrollFade.ts';

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

export const useScrollFadeEffect = (ref: RefObject<HTMLElement | null>): void => {
  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const update = () => {
      const edges = scrollFadeEdges(element);
      toggleAttribute({ element, name: 'data-fade-top', on: edges.top });
      toggleAttribute({ element, name: 'data-fade-bottom', on: edges.bottom });
    };
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
  }, [ref]);
};
