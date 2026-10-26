import { useEffectOnce } from 'react-use';

export const useOverscrollLockEffect = (): void => {
  useEffectOnce(() => {
    const root = document.documentElement;
    root.style.overscrollBehavior = 'none';
    return () => {
      root.style.overscrollBehavior = '';
    };
  });
};
