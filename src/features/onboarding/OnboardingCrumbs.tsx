import { CodeXml } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { Crumbs } from '@/components/ui/StatTile.tsx';
import { ExternalLink } from '@/components/ui/ExternalLink.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
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
