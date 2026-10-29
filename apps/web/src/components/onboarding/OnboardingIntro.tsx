import type { FC } from 'react';
import { CloudDownload, Database, HeartPulse } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvIconTile } from '@pacevault/ui/components/pvIconTile/PvIconTile.tsx';
import { PvList } from '@pacevault/ui/components/pvList/PvList.tsx';
import { PvListItem } from '@pacevault/ui/components/pvList/PvListItem.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { OnboardingCrumbs } from './OnboardingCrumbs.tsx';
import { OnboardingHeading } from '@/components/onboarding/OnboardingHeading.tsx';
import type { OnboardingShell } from './types.ts';

interface OnboardingIntroProps {
  shell: OnboardingShell;
}

/** What the app is and what the next screens ask. */
export const OnboardingIntro: FC<OnboardingIntroProps> = (props) => (
  <div className="flex flex-col gap-5">
    <div className="flex items-center gap-2">
      <img src="/logo.svg" alt="" className="size-8 shrink-0 rounded-lg" />
      <PvTypography variant="title" as="span">
        PaceVault
      </PvTypography>
    </div>
    <OnboardingHeading
      shell={props.shell}
      title={m.ui_onboarding_tagline()}
      subtitle={m.ui_onboarding_intro_desc()}
    />
    <PvList>
      <PvListItem
        icon={<PvIconTile icon={CloudDownload} />}
        primary={m.ui_onboarding_ask_source()}
        secondary={m.ui_onboarding_ask_source_desc()}
      />
      <PvListItem
        icon={<PvIconTile icon={HeartPulse} />}
        primary={m.ui_onboarding_ask_values()}
        secondary={m.ui_onboarding_ask_values_desc()}
      />
      <PvListItem
        icon={<PvIconTile icon={Database} />}
        primary={m.ui_onboarding_ask_import()}
        secondary={m.ui_onboarding_ask_import_desc()}
      />
    </PvList>
    <OnboardingCrumbs />
  </div>
);
