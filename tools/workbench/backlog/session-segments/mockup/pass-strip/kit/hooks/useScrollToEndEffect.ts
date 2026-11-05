import { useLayoutEffect, type RefObject } from 'react';

export const useScrollToEndEffect = (ref: RefObject<HTMLElement | null>, key: string): void => {
  useLayoutEffect(() => {
    const element = ref.current;
    if (element !== null) element.scrollLeft = element.scrollWidth;
  }, [ref, key]);
};
