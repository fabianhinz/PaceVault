import type { ThresholdsForm } from '@/features/settings/hooks/useThresholdsForm.ts';

/** `card`: the desktop left-column card. `dialog`: the phone Dialog. */
export type OnboardingShell = 'card' | 'dialog';

export interface ShellProps {
  thresholds: ThresholdsForm;
  onDemo: () => void;
}

export interface StepProps {
  shell: OnboardingShell;
  thresholds: ThresholdsForm;
  onDemo: () => void;
}
