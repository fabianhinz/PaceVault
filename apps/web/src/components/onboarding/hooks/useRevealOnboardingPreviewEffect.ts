import { useEffectOnce } from 'react-use';
import { useOnboardingStore } from '@/store/onboarding.ts';

export const useRevealOnboardingPreviewEffect = (): void => {
  useEffectOnce(() => {
    useOnboardingStore.getState().revealOnboardingPreview();
  });
};
