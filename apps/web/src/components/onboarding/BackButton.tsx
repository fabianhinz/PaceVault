import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { useOnboardingStore } from '@/store/onboarding.ts';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';

export const BackButton: FC = () => (
  <PvButton variant="ghost" onClick={() => useOnboardingStore.getState().previousOnboardingStep()}>
    {m.ui_btn_back()}
  </PvButton>
);
