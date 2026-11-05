import { useLayoutEffect, type RefObject } from 'react';

export const useScrollToEndEffect = ({
  ref,
  scrollKey,
}: {
  ref: RefObject<HTMLElement | null>;
  scrollKey: string;
}): void => {
  useLayoutEffect(() => {
    const element = ref.current;
    if (element !== null) element.scrollLeft = element.scrollWidth;
  }, [ref, scrollKey]);
};
