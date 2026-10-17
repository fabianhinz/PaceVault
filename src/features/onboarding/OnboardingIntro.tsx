import { CloudDownload, Database, HeartPulse } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { useOnboardingStore } from '@/store/onboarding.ts';
import { Button } from '@/components/ui/Button.tsx';
import { IconTile } from '@/components/ui/IconTile.tsx';
import { List, ListItem } from '@/components/ui/List.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { OnboardingCrumbs } from './OnboardingCrumbs.tsx';
import { OnboardingHeading, type OnboardingShell } from './OnboardingStep.tsx';

/** What the app is and what the next screens ask. */
export const OnboardingIntro = (props: { shell: OnboardingShell }) => (
  <div className="flex flex-col gap-5">
    <div className="flex items-center gap-2">
      <img src="/logo.svg" alt="" className="size-8 shrink-0 rounded-lg" />
      <Typography variant="title" as="span">
        PaceVault
      </Typography>
    </div>
    <OnboardingHeading
      shell={props.shell}
      title={m.ui_onboarding_tagline()}
      subtitle={m.ui_onboarding_intro_desc()}
    />
    <List>
      <ListItem
        icon={<IconTile icon={CloudDownload} />}
        primary={m.ui_onboarding_ask_source()}
        secondary={m.ui_onboarding_ask_source_desc()}
      />
      <ListItem
        icon={<IconTile icon={HeartPulse} />}
        primary={m.ui_onboarding_ask_values()}
        secondary={m.ui_onboarding_ask_values_desc()}
      />
      <ListItem
        icon={<IconTile icon={Database} />}
        primary={m.ui_onboarding_ask_import()}
        secondary={m.ui_onboarding_ask_import_desc()}
      />
    </List>
    <OnboardingCrumbs />
  </div>
);

export const OnboardingIntroActions = (props: { onDemo: () => void }) => (
  <>
    <Button variant="secondary" onClick={props.onDemo}>
      {m.ui_onboarding_demo_title()}
    </Button>
    <Button onClick={() => useOnboardingStore.getState().startOnboardingSetup()}>
      {m.ui_onboarding_get_started()}
    </Button>
  </>
);
