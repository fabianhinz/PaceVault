import { useEffect } from 'react';

export const useSheetPeekActiveEffect = (
  setActive: ((active: boolean) => void) | undefined,
): void => {
  useEffect(() => {
    if (setActive === undefined) return;
    setActive(true);
    return () => setActive(false);
  }, [setActive]);
};
