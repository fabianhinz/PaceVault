import type { ReactNode } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { useLayoutStore } from '@/store/layout.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import {
  useOnboardingStore,
  type OnboardingSource,
  type OnboardingStep as Step,
} from '@/store/onboarding.ts';
import { FitUploadButton } from '@/components/sessions/FitUploadButton.tsx';
import { Intervals } from '@/components/intervals/index.tsx';
import type { ThresholdsForm } from '@/components/settings/hooks/types.ts';
import type { FormField, ProfileGate } from '@/components/settings/hooks/types.ts';
import { ContinueButton } from '@/components/onboarding/ContinueButton.tsx';
import { SourcePicker } from '@/components/onboarding/SourcePicker.tsx';
import { ThresholdFields } from '@/components/onboarding/ThresholdFields.tsx';
import { YouFields } from '@/components/onboarding/YouFields.tsx';
import { fieldId } from '@/components/onboarding/onboardingFields.ts';
import type { StepProps } from '@/components/onboarding/types.ts';

interface Screen {
  title: string;
  subtitle: string;
  body: ReactNode;
  primary: ReactNode | null;
}

const YOU_FIELDS: FormField[] = ['gender', 'restHr', 'maxHr', 'weight', 'birthYear'];
const THRESHOLD_FIELDS: FormField[] = ['ftp', 'thresholdPace', 'thresholdHr'];

const nextStep = () => useOnboardingStore.getState().nextOnboardingStep();

const completeOnboarding = () => useLayoutStore.getState().completeOnboarding();
const continueStep = ({
  thresholds,
  fields,
}: {
  thresholds: ThresholdsForm;
  fields: FormField[];
}) => {
  const first = thresholds.revealErrors(fields).at(0);
  if (first === undefined) {
    nextStep();
    return;
  }
  document.getElementById(fieldId(first))?.focus();
};

export const screenOf = ({
  step,
  source,
  props,
  profileGate,
}: {
  step: Step;
  source: OnboardingSource | null;
  props: StepProps;
  profileGate: ProfileGate;
}): Screen => {
  const thresholds = props.thresholds;
  switch (step) {
    case 'source':
      return {
        title: m.ui_onboarding_source_title(),
        subtitle: m.ui_onboarding_source_subtitle(),
        body: <SourcePicker onDemo={props.onDemo} />,
        primary: null,
      };
    case 'you':
      return {
        title: m.ui_onboarding_you_title(),
        subtitle: m.ui_onboarding_you_subtitle(),
        body: <YouFields thresholds={thresholds} />,
        primary: (
          <ContinueButton onClick={() => continueStep({ thresholds, fields: YOU_FIELDS })} />
        ),
      };
    case 'thresholds':
      return {
        title: m.ui_onboarding_thresholds_title(),
        subtitle: m.ui_onboarding_thresholds_subtitle(),
        body: <ThresholdFields thresholds={thresholds} />,
        primary: (
          <ContinueButton onClick={() => continueStep({ thresholds, fields: THRESHOLD_FIELDS })} />
        ),
      };
    case 'intro':
    case 'import':
      if (source === 'intervals') {
        return {
          title: m.ui_onboarding_connect_title(),
          subtitle: m.ui_onboarding_connect_subtitle(),
          body: <Intervals profileGate={profileGate} onSynced={completeOnboarding} />,
          primary: <span className="invisible" />,
        };
      }
      return {
        title: m.ui_onboarding_upload_title(),
        subtitle: m.ui_fit_files_desc(),
        body: null,
        primary: (
          <FitUploadButton
            profileGate={profileGate}
            onUploaded={() => {
              if (useSessionsStore.getState().sessions.length > 0) completeOnboarding();
            }}
          />
        ),
      };
  }
};
