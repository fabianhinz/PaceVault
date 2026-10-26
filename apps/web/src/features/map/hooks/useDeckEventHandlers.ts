import { useMemo } from 'react';
import { useLayoutStore } from '@/store/layout.ts';
import type { DeckEventHandlers, PickHandler } from './types.ts';

export const useDeckEventHandlers = ({
  onClick,
  onHover,
}: {
  onClick: PickHandler | undefined;
  onHover: PickHandler | undefined;
}): DeckEventHandlers => {
  const onboardingComplete = useLayoutStore((s) => s.onboardingComplete);

  return useMemo((): DeckEventHandlers => {
    if (onboardingComplete) return { onClick, onHover };
    return {};
  }, [onboardingComplete, onClick, onHover]);
};
