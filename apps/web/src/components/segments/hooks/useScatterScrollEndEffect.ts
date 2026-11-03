import { useLayoutEffect, type RefObject } from 'react';

export const useScatterScrollEndEffect = ({
  ref,
  contentWidthPx,
}: {
  ref: RefObject<HTMLElement | null>;
  contentWidthPx: number;
}): void => {
  useLayoutEffect(() => {
    const element = ref.current;
    if (element === null || contentWidthPx <= 0) return;
    element.scrollLeft = element.scrollWidth;
  }, [ref, contentWidthPx]);
};
