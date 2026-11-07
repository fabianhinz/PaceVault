import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { useOnboardingStore } from '@/store/onboarding.ts';
import { PvDialog } from '@pacevault/ui/components/pvDialog/PvDialog.tsx';
import { PhoneCard } from '@/components/onboarding/PhoneCard.tsx';
import { ReopenPill } from '@/components/onboarding/ReopenPill.tsx';
import { ONBOARDING_HEADING_ID, type ShellProps } from '@/components/onboarding/types.ts';

export const PhoneOnboarding: FC<ShellProps> = (props) => {
  const open = useOnboardingStore((s) => s.onboardingCardOpen);
  return (
    <>
      <PvDialog
        open={open}
        onOpenChange={(next) => useOnboardingStore.getState().setOnboardingCardOpen(next)}
        modal={false}
        closeLabel={m.ui_sheet_drag_close()}
        scrim={false}
        data-layout="onboarding-card"
        aria-labelledby={ONBOARDING_HEADING_ID}
      >
        <PhoneCard thresholds={props.thresholds} onDemo={props.onDemo} />
      </PvDialog>
      {!open && <ReopenPill />}
    </>
  );
};
