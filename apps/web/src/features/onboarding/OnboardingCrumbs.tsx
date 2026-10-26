import type { FC } from 'react';
import { CodeXml } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvCrumbs } from '@pacevault/ui/components/pvCrumbs/PvCrumbs.tsx';
import { PvExternalLink } from '@pacevault/ui/components/pvExternalLink/PvExternalLink.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { GITHUB_URL } from '@/features/settings/AboutSection.tsx';

export const OnboardingCrumbs: FC = () => (
  <PvTypography variant="caption" color="textTertiary" as="div" data-testid="onboarding-crumbs">
    <PvCrumbs
      wrap
      items={[
        m.ui_onboarding_crumb_device(),
        m.ui_onboarding_crumb_offline(),
        <PvExternalLink key="oss" href={GITHUB_URL} icon={CodeXml}>
          {m.ui_onboarding_crumb_oss()}
        </PvExternalLink>,
      ]}
    />
  </PvTypography>
);
