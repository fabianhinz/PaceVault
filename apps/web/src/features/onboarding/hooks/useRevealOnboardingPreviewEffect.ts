import { useEffect } from 'react';
import { useOnboardingStore } from '@/store/onboarding.ts';

export const useRevealOnboardingPreviewEffect = (): void => {
  useEffect(() => {
    useOnboardingStore.getState().revealOnboardingPreview();
  }, []);
};
