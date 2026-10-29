import type { FC } from 'react';
import { useRevealOnboardingPreviewEffect } from './hooks/useRevealOnboardingPreviewEffect.ts';
import type { QueryClient } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { m } from '@pacevault/i18n/messages.js';
import { useLayoutStore } from '@/store/layout.ts';
import { useImportProgressStore } from '@/store/importProgress.ts';
import { useOnboardingStore } from '@/store/onboarding.ts';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { loadDemoData } from '@/components/demo/loadDemoData.ts';
import { useThresholdsForm } from '@/components/settings/hooks/useThresholdsForm.ts';
import { DesktopOnboarding } from '@/components/onboarding/DesktopOnboarding.tsx';
import { PhoneOnboarding } from '@/components/onboarding/PhoneOnboarding.tsx';

const startOnboardingDemo = async (queryClient: QueryClient) => {
  try {
    await loadDemoData(queryClient);
    useLayoutStore.getState().completeOnboarding();
    useLayoutStore.getState().setDemoMode(true);
  } catch {
    useImportProgressStore
      .getState()
      .finishImport({ kind: 'failed', message: m.ui_import_failed_generic() });
  }
};

/**
 * Onboarding over the live map: the intro and the four steps in a left-column card (desktop)
 * or a scrim-less Dialog with a reopen pill (phone); mounting it reveals the demo preview.
 * The form lives here, so its values survive the steps and a phone close / reopen.
 */
export const Onboarding: FC = () => {
  const device = useDevice();
  const revealed = useOnboardingStore((s) => s.onboardingPreviewRevealed);
  const queryClient = useQueryClient();
  const thresholds = useThresholdsForm('create');
  const onDemo = () => void startOnboardingDemo(queryClient);

  useRevealOnboardingPreviewEffect();

  return (
    <>
      {revealed && device.desktop && <DesktopOnboarding thresholds={thresholds} onDemo={onDemo} />}
      {revealed && !device.desktop && <PhoneOnboarding thresholds={thresholds} onDemo={onDemo} />}
    </>
  );
};
