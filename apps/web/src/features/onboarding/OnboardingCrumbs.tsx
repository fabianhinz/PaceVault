import { CodeXml } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { Crumbs } from '@pacevault/ui/components/StatTile.tsx';
import { ExternalLink } from '@pacevault/ui/components/ExternalLink.tsx';
import { Typography } from '@pacevault/ui/components/Typography.tsx';
import { GITHUB_URL } from '@/features/settings/AboutSection.tsx';

export const OnboardingCrumbs = () => (
  <Typography variant="caption" color="textTertiary" as="div" data-testid="onboarding-crumbs">
    <Crumbs
      wrap
      items={[
        m.ui_onboarding_crumb_device(),
        m.ui_onboarding_crumb_offline(),
        <ExternalLink key="oss" href={GITHUB_URL} icon={CodeXml}>
          {m.ui_onboarding_crumb_oss()}
        </ExternalLink>,
      ]}
    />
  </Typography>
);
