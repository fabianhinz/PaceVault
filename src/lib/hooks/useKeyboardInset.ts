import { useSyncExternalStore } from 'react';

const subscribe = (onChange: () => void) => {
  const viewport = window.visualViewport;
  if (viewport === null) {
    return () => {};
  }
  viewport.addEventListener('resize', onChange);
  viewport.addEventListener('scroll', onChange);
  return () => {
    viewport.removeEventListener('resize', onChange);
    viewport.removeEventListener('scroll', onChange);
  };
};

const coveredHeight = (): number => {
  const viewport = window.visualViewport;
  if (viewport === null) {
    return 0;
  }
  return Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop));
};

export const useKeyboardInset = (enabled: boolean): number => {
  const inset = useSyncExternalStore(subscribe, coveredHeight);
  if (!enabled) {
    return 0;
  }
  return inset;
};
