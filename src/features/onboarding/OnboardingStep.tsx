import { useRef, type ReactNode } from 'react';
import { CloudDownload, Database, FolderUp, User, type LucideIcon } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import type { Gender } from '@/packages/engine/types.ts';
import { useLayoutStore } from '@/store/layout.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import {
  useOnboardingStore,
  type OnboardingSource,
  type OnboardingStep as Step,
} from '@/store/onboarding.ts';
import { useScrollFadeEffect } from '@/lib/hooks/useScrollFadeEffect.ts';
import { ActionTile } from '@/components/ui/ActionTile.tsx';
import { Button } from '@/components/ui/Button.tsx';
import {
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/Dialog.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Label } from '@/components/ui/Label.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { FitUploadButton } from '@/features/sessions/FitUploadButton.tsx';
import { IntervalsConnectionForm } from '@/features/intervals/IntervalsConnectionForm.tsx';
import type {
  NumberField,
  ProfileGate,
  ThresholdsForm,
} from '@/features/settings/hooks/useThresholdsForm.ts';
import { OnboardingProgress } from './OnboardingProgress.tsx';

/** `card`: the desktop left-column card. `dialog`: the phone Dialog. */
export type OnboardingShell = 'card' | 'dialog';

interface StepProps {
  shell: OnboardingShell;
  thresholds: ThresholdsForm;
  onDemo: () => void;
}

interface Screen {
  title: string;
  subtitle: string;
  body: ReactNode;
  primary: ReactNode;
}

export const OnboardingHeading = (props: {
  shell: OnboardingShell;
  title: string;
  subtitle: string;
}) => {
  if (props.shell === 'dialog') {
    return (
      <div className="flex flex-col gap-2">
        <DialogTitle className="text-2xl font-bold">{props.title}</DialogTitle>
        <DialogDescription className="text-text-secondary">{props.subtitle}</DialogDescription>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <Typography variant="h1">{props.title}</Typography>
      <Typography variant="body1" color="textSecondary">
        {props.subtitle}
      </Typography>
    </div>
  );
};

interface SourceOption {
  id: OnboardingSource;
  icon: LucideIcon;
  title: () => string;
  description: () => string;
}

const SOURCES: SourceOption[] = [
  {
    id: 'intervals',
    icon: CloudDownload,
    title: m.ui_onboarding_intervals_title,
    description: m.ui_onboarding_intervals_desc,
  },
  {
    id: 'fit',
    icon: FolderUp,
    title: m.ui_fit_files_title,
    description: m.ui_onboarding_fit_desc,
  },
  {
    id: 'demo',
    icon: Database,
    title: m.ui_onboarding_demo_title,
    description: m.ui_onboarding_demo_desc,
  },
];

const SourcePicker = () => {
  const source = useOnboardingStore((s) => s.source);
  return (
    <div role="radiogroup" className="flex flex-col gap-2">
      {SOURCES.map((option) => (
        <ActionTile
          key={option.id}
          icon={option.icon}
          title={option.title()}
          description={option.description()}
          selected={source === option.id}
          buttonProps={{ role: 'radio', 'aria-checked': source === option.id }}
          onClick={() => useOnboardingStore.getState().pickOnboardingSource(option.id)}
        />
      ))}
    </div>
  );
};

const GENDERS: { id: Gender; label: () => string }[] = [
  { id: 'male', label: m.ui_thresholds_male },
  { id: 'female', label: m.ui_thresholds_female },
];

const NumberInput = (props: {
  thresholds: ThresholdsForm;
  field: NumberField;
  label: string;
  hint: string;
  placeholder: string;
  required?: boolean;
}) => {
  const id = `onboarding-${props.field}`;
  const error = props.thresholds.visibleError(props.field);
  return (
    <div>
      <Label htmlFor={id} required={props.required}>
        {props.label}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        placeholder={props.placeholder}
        value={props.thresholds.form[props.field]}
        onChange={(e) => props.thresholds.setField(props.field, e.target.value)}
        onBlur={() => props.thresholds.revealErrors([props.field])}
        helperText={error || props.hint}
        error={error !== ''}
        reserveHelper
      />
    </div>
  );
};

const YouFields = (props: { thresholds: ThresholdsForm }) => (
  <div className="grid grid-cols-1 gap-3">
    <div>
      <Label id="onboarding-gender" required>
        {m.ui_thresholds_gender()}
      </Label>
      <div role="radiogroup" aria-labelledby="onboarding-gender" className="flex flex-col gap-2">
        {GENDERS.map((option) => (
          <ActionTile
            key={option.id}
            icon={User}
            title={option.label()}
            selected={props.thresholds.form.gender === option.id}
            buttonProps={{
              role: 'radio',
              'aria-checked': props.thresholds.form.gender === option.id,
            }}
            onClick={() => props.thresholds.setGender(option.id)}
          />
        ))}
      </div>
    </div>
    <NumberInput
      thresholds={props.thresholds}
      field="restHr"
      label={m.ui_thresholds_resting_hr()}
      hint={m.ui_onboarding_rest_hr_hint()}
      placeholder="52"
      required
    />
    <NumberInput
      thresholds={props.thresholds}
      field="maxHr"
      label={m.ui_thresholds_max_hr()}
      hint={m.ui_onboarding_max_hr_hint()}
      placeholder="186"
      required
    />
  </div>
);

// `onAttempt`: a press on the (disabled) button reveals the step's field errors. The disabled
// button has no pointer events, so the press lands on this wrapper.
const ContinueButton = (props: {
  disabled: boolean;
  onClick: () => void;
  onAttempt?: () => void;
}) => (
  <div className="grid" onPointerDown={props.onAttempt}>
    <Button disabled={props.disabled} onClick={props.onClick}>
      {m.ui_btn_continue()}
    </Button>
  </div>
);

const nextStep = () => useOnboardingStore.getState().nextOnboardingStep();

const completeOnboarding = () => useLayoutStore.getState().completeOnboarding();

const screenOf = (
  step: Step,
  source: OnboardingSource | null,
  props: StepProps,
  profileGate: ProfileGate,
): Screen => {
  const thresholds = props.thresholds;
  if (step === 'source') {
    return {
      title: m.ui_onboarding_source_title(),
      subtitle: m.ui_onboarding_source_subtitle(),
      body: <SourcePicker />,
      primary: (
        <ContinueButton
          disabled={source === null}
          onClick={source === 'demo' ? props.onDemo : nextStep}
        />
      ),
    };
  }
  if (step === 'you') {
    return {
      title: m.ui_onboarding_you_title(),
      subtitle: m.ui_onboarding_you_subtitle(),
      body: <YouFields thresholds={thresholds} />,
      primary: (
        <ContinueButton
          disabled={
            thresholds.form.gender === null ||
            !thresholds.fieldValid('restHr') ||
            !thresholds.fieldValid('maxHr')
          }
          onClick={nextStep}
          onAttempt={() => thresholds.revealErrors(['restHr', 'maxHr'])}
        />
      ),
    };
  }
  if (step === 'bike') {
    return {
      title: m.ui_onboarding_bike_title(),
      subtitle: m.ui_onboarding_bike_subtitle(),
      body: (
        <NumberInput
          thresholds={thresholds}
          field="ftp"
          label={m.ui_thresholds_ftp()}
          hint={m.ui_onboarding_add_later()}
          placeholder="240"
        />
      ),
      primary: (
        <ContinueButton
          disabled={!thresholds.fieldValid('ftp')}
          onClick={nextStep}
          onAttempt={() => thresholds.revealErrors(['ftp'])}
        />
      ),
    };
  }
  if (source === 'intervals') {
    return {
      title: m.ui_onboarding_connect_title(),
      subtitle: m.ui_onboarding_connect_subtitle(),
      body: <IntervalsConnectionForm profileGate={profileGate} onSynced={completeOnboarding} />,
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
};

const BackButton = () => (
  <Button variant="ghost" onClick={() => useOnboardingStore.getState().previousOnboardingStep()}>
    {m.ui_btn_back()}
  </Button>
);

const CardBody = (props: { children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  useScrollFadeEffect(ref);
  return (
    <div
      ref={ref}
      className="scroll-fade -mx-6 mt-8 min-h-0 flex-1 overflow-y-auto overscroll-contain px-6"
    >
      {props.children}
    </div>
  );
};

/** One flow screen: progress, question, subtitle, fields, then Back and the step's primary action. */
export const OnboardingStep = (props: StepProps) => {
  const step = useOnboardingStore((s) => s.step);
  const source = useOnboardingStore((s) => s.source);
  const profileGate: ProfileGate = { ready: props.thresholds.valid, save: props.thresholds.save };
  const screen = screenOf(step, source, props, profileGate);
  const heading = (
    <OnboardingHeading shell={props.shell} title={screen.title} subtitle={screen.subtitle} />
  );

  if (props.shell === 'dialog') {
    return (
      <>
        <DialogBody>
          <div className="flex flex-col gap-6">
            <OnboardingProgress />
            {heading}
            {screen.body !== null && <div>{screen.body}</div>}
          </div>
        </DialogBody>
        <DialogFooter className="grid-cols-[auto_1fr]">
          <BackButton />
          {screen.primary}
        </DialogFooter>
      </>
    );
  }
  return (
    <>
      <OnboardingProgress />
      <CardBody>
        <div className="flex flex-col gap-8">
          {heading}
          {screen.body !== null && <div>{screen.body}</div>}
        </div>
      </CardBody>
      <DialogFooter>
        <BackButton />
        {screen.primary}
      </DialogFooter>
    </>
  );
};
