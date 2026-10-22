import { useRef, useState, type ReactNode } from 'react';
import { CloudDownload, Database, FolderUp, User, type LucideIcon } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import type { Gender } from '@pacevault/engine/types.ts';
import { useLayoutStore } from '@/store/layout.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import {
  useOnboardingStore,
  type OnboardingSource,
  type OnboardingStep as Step,
} from '@/store/onboarding.ts';
import { formatPaceInput } from '@/lib/formatters.ts';
import { useScrollFadeEffect } from '@pacevault/ui/hooks/useScrollFadeEffect.ts';
import { ActionTile } from '@pacevault/ui/components/ActionTile.tsx';
import { Button } from '@pacevault/ui/components/Button.tsx';
import {
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@pacevault/ui/components/Dialog.tsx';
import { HelperText } from '@pacevault/ui/components/HelperText.tsx';
import { Input } from '@pacevault/ui/components/Input.tsx';
import { Label } from '@pacevault/ui/components/Label.tsx';
import { Typography } from '@pacevault/ui/components/Typography.tsx';
import { FitUploadButton } from '@/features/sessions/FitUploadButton.tsx';
import { IntervalsConnectionForm } from '@/features/intervals/IntervalsConnectionForm.tsx';
import { PaceEstimateButton } from '@/features/settings/PaceEstimateButton.tsx';
import { PaceEstimatorDialog } from '@/features/settings/PaceEstimatorDialog.tsx';
import type {
  FormField,
  ProfileGate,
  TextField,
  ThresholdsForm,
} from '@/features/settings/hooks/useThresholdsForm.ts';
import { OnboardingProgress } from './OnboardingProgress.tsx';
import { useStepFocusEffect } from './hooks/useStepFocusEffect.ts';

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
  /** `null`: the step has no footer (the source step advances on a tile tap). */
  primary: ReactNode | null;
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
  id: OnboardingSource | 'demo';
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

// A tile is the step's answer: it advances right away, the demo straight into the app.
const pickSource = (id: SourceOption['id'], onDemo: () => void) => {
  if (id === 'demo') {
    onDemo();
    return;
  }
  useOnboardingStore.getState().chooseOnboardingSource(id);
};

const SourcePicker = (props: { onDemo: () => void }) => (
  <div className="flex flex-col gap-2">
    {SOURCES.map((option) => (
      <ActionTile
        key={option.id}
        icon={option.icon}
        title={option.title()}
        description={option.description()}
        onClick={() => pickSource(option.id, props.onDemo)}
      />
    ))}
  </div>
);

const GENDERS: { id: Gender; label: () => string }[] = [
  { id: 'male', label: m.ui_thresholds_male },
  { id: 'female', label: m.ui_thresholds_female },
];

const fieldId = (field: FormField) => `onboarding-${field}`;

const FieldInput = (props: {
  thresholds: ThresholdsForm;
  field: TextField;
  label: string;
  hint: string;
  placeholder: string;
  inputMode: 'numeric' | 'decimal' | 'text';
  required?: boolean;
}) => {
  const id = fieldId(props.field);
  const error = props.thresholds.visibleError(props.field);
  return (
    <div>
      <Label htmlFor={id} required={props.required}>
        {props.label}
      </Label>
      <Input
        id={id}
        type={props.inputMode === 'text' ? 'text' : 'number'}
        inputMode={props.inputMode}
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

// Like the inputs: the error goes in the reserved helper line under the tiles, so nothing moves.
const GenderPick = (props: { thresholds: ThresholdsForm }) => {
  const error = props.thresholds.visibleError('gender');
  return (
    <div>
      <Label id="onboarding-gender-label" required>
        {m.ui_thresholds_gender()}
      </Label>
      <div
        role="radiogroup"
        aria-labelledby="onboarding-gender-label"
        aria-describedby="onboarding-gender-error"
        aria-invalid={error !== ''}
        className="flex flex-col gap-2"
      >
        {GENDERS.map((option, index) => (
          <ActionTile
            key={option.id}
            icon={User}
            title={option.label()}
            selected={props.thresholds.form.gender === option.id}
            className={error === '' ? undefined : 'border-status-danger-strong'}
            buttonProps={{
              id: index === 0 ? fieldId('gender') : undefined,
              role: 'radio',
              'aria-checked': props.thresholds.form.gender === option.id,
            }}
            onClick={() => props.thresholds.setGender(option.id)}
          />
        ))}
      </div>
      <HelperText id="onboarding-gender-error" error={error !== ''}>
        {error}
      </HelperText>
    </div>
  );
};

const YOU_FIELDS: FormField[] = ['gender', 'restHr', 'maxHr', 'weight', 'birthYear'];
const THRESHOLD_FIELDS: FormField[] = ['ftp', 'thresholdPace', 'thresholdHr'];

const YouFields = (props: { thresholds: ThresholdsForm }) => (
  <div className="grid grid-cols-1 gap-3">
    <GenderPick thresholds={props.thresholds} />
    <FieldInput
      thresholds={props.thresholds}
      field="restHr"
      label={m.ui_thresholds_resting_hr()}
      hint={m.ui_onboarding_rest_hr_hint()}
      placeholder="52"
      inputMode="numeric"
      required
    />
    <FieldInput
      thresholds={props.thresholds}
      field="maxHr"
      label={m.ui_thresholds_max_hr()}
      hint={m.ui_onboarding_max_hr_hint()}
      placeholder="186"
      inputMode="numeric"
      required
    />
    <FieldInput
      thresholds={props.thresholds}
      field="weight"
      label={m.ui_thresholds_weight()}
      hint={m.ui_onboarding_weight_hint()}
      placeholder="70"
      inputMode="decimal"
    />
    <FieldInput
      thresholds={props.thresholds}
      field="birthYear"
      label={m.ui_thresholds_birth_year()}
      hint={m.ui_onboarding_birth_year_hint()}
      placeholder="1990"
      inputMode="numeric"
    />
  </div>
);

const ThresholdFields = (props: { thresholds: ThresholdsForm }) => {
  const [estimatorOpen, setEstimatorOpen] = useState(false);
  return (
    <div className="grid grid-cols-1 gap-3">
      <FieldInput
        thresholds={props.thresholds}
        field="ftp"
        label={m.ui_thresholds_ftp()}
        hint={m.ui_onboarding_ftp_hint()}
        placeholder="240"
        inputMode="numeric"
      />
      <div className="flex flex-col gap-1">
        <FieldInput
          thresholds={props.thresholds}
          field="thresholdPace"
          label={m.ui_thresholds_threshold_pace()}
          hint={m.ui_onboarding_pace_hint()}
          placeholder="4:30"
          inputMode="text"
        />
        <div className="text-xs">
          <PaceEstimateButton onClick={() => setEstimatorOpen(true)} />
        </div>
      </div>
      <PaceEstimatorDialog
        open={estimatorOpen}
        onOpenChange={setEstimatorOpen}
        onSave={(paceSecPerKm) =>
          props.thresholds.setField('thresholdPace', formatPaceInput(paceSecPerKm))
        }
      />
      <FieldInput
        thresholds={props.thresholds}
        field="thresholdHr"
        label={m.ui_thresholds_threshold_hr()}
        hint={m.ui_onboarding_threshold_hr_hint()}
        placeholder="165"
        inputMode="numeric"
      />
    </div>
  );
};

const ContinueButton = (props: { onClick: () => void }) => (
  <Button onClick={props.onClick}>{m.ui_btn_continue()}</Button>
);

const nextStep = () => useOnboardingStore.getState().nextOnboardingStep();

const completeOnboarding = () => useLayoutStore.getState().completeOnboarding();

// Continue is always pressable: with an invalid field it shows the step's errors, focuses the
// first invalid field and stays on the step.
const continueStep = (thresholds: ThresholdsForm, fields: FormField[]) => {
  const first = thresholds.revealErrors(fields).at(0);
  if (first === undefined) {
    nextStep();
    return;
  }
  document.getElementById(fieldId(first))?.focus();
};

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
      body: <SourcePicker onDemo={props.onDemo} />,
      primary: null,
    };
  }
  if (step === 'you') {
    return {
      title: m.ui_onboarding_you_title(),
      subtitle: m.ui_onboarding_you_subtitle(),
      body: <YouFields thresholds={thresholds} />,
      primary: <ContinueButton onClick={() => continueStep(thresholds, YOU_FIELDS)} />,
    };
  }
  if (step === 'thresholds') {
    return {
      title: m.ui_onboarding_thresholds_title(),
      subtitle: m.ui_onboarding_thresholds_subtitle(),
      body: <ThresholdFields thresholds={thresholds} />,
      primary: <ContinueButton onClick={() => continueStep(thresholds, THRESHOLD_FIELDS)} />,
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
  const headingRef = useRef<HTMLDivElement>(null);
  useStepFocusEffect(step, headingRef);
  const profileGate: ProfileGate = { ready: props.thresholds.valid, save: props.thresholds.save };
  const screen = screenOf(step, source, props, profileGate);
  const heading = (
    <div ref={headingRef} tabIndex={-1} className="outline-none">
      <OnboardingHeading shell={props.shell} title={screen.title} subtitle={screen.subtitle} />
    </div>
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
        {screen.primary !== null && (
          <DialogFooter className="grid-cols-[auto_1fr]">
            <BackButton />
            {screen.primary}
          </DialogFooter>
        )}
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
      {screen.primary !== null && (
        <DialogFooter>
          <BackButton />
          {screen.primary}
        </DialogFooter>
      )}
    </>
  );
};
