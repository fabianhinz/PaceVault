import type { QueryClient } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { ListChecks } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { useLayoutStore } from '@/store/layout.ts';
import { useImportProgressStore } from '@/store/importProgress.ts';
import {
  ONBOARDING_FLOW_STEPS,
  onboardingProgressOf,
  useOnboardingStore,
} from '@/store/onboarding.ts';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { Card } from '@pacevault/ui/components/Card.tsx';
import {
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogRoot,
} from '@pacevault/ui/components/Dialog.tsx';
import { FloatingPill } from '@pacevault/ui/components/FloatingPill.tsx';
import { loadDemoData } from '@/features/demo/loadDemoData.ts';
import {
  useThresholdsForm,
  type ThresholdsForm,
} from '@/features/settings/hooks/useThresholdsForm.ts';
import { LogoLoader } from './LogoLoader.tsx';
import { OnboardingIntro, OnboardingIntroActions } from './OnboardingIntro.tsx';
import { OnboardingStep } from './OnboardingStep.tsx';

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

interface ShellProps {
  thresholds: ThresholdsForm;
  onDemo: () => void;
}

const DesktopOnboarding = (props: ShellProps) => {
  const step = useOnboardingStore((s) => s.step);
  if (step === 'intro') {
    return (
      <Card
        floating
        data-layout="onboarding-card"
        className="fixed top-1/2 left-6 z-10 w-[440px] -translate-y-1/2 p-6"
      >
        <OnboardingIntro shell="card" />
        <DialogFooter>
          <OnboardingIntroActions onDemo={props.onDemo} />
        </DialogFooter>
      </Card>
    );
  }
  return (
    <Card
      floating
      data-layout="onboarding-card"
      className="fixed top-6 bottom-6 left-6 z-10 w-[440px] p-6"
    >
      <OnboardingStep shell="card" thresholds={props.thresholds} onDemo={props.onDemo} />
    </Card>
  );
};

const PhoneCard = (props: ShellProps) => {
  const step = useOnboardingStore((s) => s.step);
  if (step === 'intro') {
    return (
      <>
        <DialogBody>
          <OnboardingIntro shell="dialog" />
        </DialogBody>
        <DialogFooter>
          <OnboardingIntroActions onDemo={props.onDemo} />
        </DialogFooter>
      </>
    );
  }
  return <OnboardingStep shell="dialog" thresholds={props.thresholds} onDemo={props.onDemo} />;
};

const ReopenPill = () => {
  const step = useOnboardingStore((s) => s.step);
  let label = m.ui_onboarding_pill_start();
  if (step !== 'intro') {
    label = m.ui_onboarding_pill_continue({
      step: onboardingProgressOf(step),
      total: ONBOARDING_FLOW_STEPS.length,
    });
  }
  return (
    <FloatingPill
      data-layout="onboarding-pill"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] left-1/2 z-10 -translate-x-1/2"
      onClick={() => useOnboardingStore.getState().setOnboardingCardOpen(true)}
    >
      <ListChecks size={14} aria-hidden className="text-text-tertiary" />
      {label}
    </FloatingPill>
  );
};

const PhoneOnboarding = (props: ShellProps) => {
  const open = useOnboardingStore((s) => s.onboardingCardOpen);
  return (
    <>
      <DialogRoot
        open={open}
        onOpenChange={(next) => useOnboardingStore.getState().setOnboardingCardOpen(next)}
        modal={false}
      >
        <DialogContent scrim={false} data-layout="onboarding-card">
          <PhoneCard thresholds={props.thresholds} onDemo={props.onDemo} />
        </DialogContent>
      </DialogRoot>
      {!open && <ReopenPill />}
    </>
  );
};

/**
 * Onboarding over the live map: the logo loader, then the intro and the four steps in a
 * left-column card (desktop) or a scrim-less Dialog with a reopen pill (phone).
 * The form lives here, so its values survive the steps and a phone close / reopen.
 */
export const OnboardingFlow = () => {
  const device = useDevice();
  const revealed = useOnboardingStore((s) => s.onboardingPreviewRevealed);
  const queryClient = useQueryClient();
  const thresholds = useThresholdsForm('create');
  const onDemo = () => void startOnboardingDemo(queryClient);

  return (
    <>
      <LogoLoader />
      {revealed && device.isDesktop && (
        <DesktopOnboarding thresholds={thresholds} onDemo={onDemo} />
      )}
      {revealed && !device.isDesktop && <PhoneOnboarding thresholds={thresholds} onDemo={onDemo} />}
    </>
  );
};
