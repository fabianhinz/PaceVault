import { ExternalLink } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { Crumbs } from '@/components/ui/StatTile.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { GITHUB_URL } from '@/features/settings/AboutSection.tsx';

export const OnboardingCrumbs = () => (
  <Typography variant="caption" color="textTertiary" as="div" data-testid="onboarding-crumbs">
    <Crumbs
      wrap
      items={[
        m.ui_onboarding_crumb_device(),
        m.ui_onboarding_crumb_offline(),
        m.ui_onboarding_crumb_map(),
        <a
          key="oss"
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 text-accent hover:underline"
        >
          {m.ui_onboarding_crumb_oss()}
          <ExternalLink size={12} aria-hidden className="shrink-0" />
        </a>,
      ]}
    />
  </Typography>
);
