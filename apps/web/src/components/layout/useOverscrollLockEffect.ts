import { useEffect } from 'react';

export const useOverscrollLockEffect = (): void => {
  useEffect(() => {
    const root = document.documentElement;
    root.style.overscrollBehavior = 'none';
    return () => {
      root.style.overscrollBehavior = '';
    };
  }, []);
};
