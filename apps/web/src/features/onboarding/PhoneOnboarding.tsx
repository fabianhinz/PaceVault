import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { useOnboardingStore } from '@/store/onboarding.ts';
import { PvDialogContent } from '@pacevault/ui/components/pvDialog/PvDialogContent.tsx';
import { PvDialog } from '@pacevault/ui/components/pvDialog/PvDialog.tsx';
import { PhoneCard } from '@/features/onboarding/PhoneCard.tsx';
import { ReopenPill } from '@/features/onboarding/ReopenPill.tsx';
import type { ShellProps } from '@/features/onboarding/types.ts';

export const PhoneOnboarding: FC<ShellProps> = (props) => {
  const open = useOnboardingStore((s) => s.onboardingCardOpen);
  return (
    <>
      <PvDialog
        open={open}
        onOpenChange={(next) => useOnboardingStore.getState().setOnboardingCardOpen(next)}
        modal={false}
      >
        <PvDialogContent
          closeLabel={m.ui_sheet_drag_close()}
          scrim={false}
          data-layout="onboarding-card"
        >
          <PhoneCard thresholds={props.thresholds} onDemo={props.onDemo} />
        </PvDialogContent>
      </PvDialog>
      {!open && <ReopenPill />}
    </>
  );
};
