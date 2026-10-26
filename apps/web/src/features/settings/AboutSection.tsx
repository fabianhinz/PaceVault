import type { FC } from 'react';
import { CodeXml, BookOpen } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { PvCardHeader } from '@pacevault/ui/components/pvCardHeader/PvCardHeader.tsx';
import { PvList } from '@pacevault/ui/components/pvList/PvList.tsx';
import { PvListItem } from '@pacevault/ui/components/pvList/PvListItem.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';

export const GITHUB_URL = 'https://github.com/fabianhinz/PaceVault';
const SOURCES_URL = 'https://github.com/fabianhinz/PaceVault/blob/main/packages/engine/SOURCES.md';

const openExternal = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

export const AboutSection: FC = () => (
  <PvCard
    footer={
      <div className="flex justify-end">
        <PvTypography variant="caption">
          {m.ui_settings_about_version()}: {import.meta.env.VITE_APP_COMMIT}
        </PvTypography>
      </div>
    }
  >
    <PvCardHeader title={m.ui_settings_about_title()} subtitle={m.ui_settings_about_desc()} />
    <PvList>
      <PvListItem
        icon={<CodeXml size={18} />}
        primary={m.ui_settings_about_github()}
        secondary={m.ui_settings_about_github_desc()}
        onClick={() => openExternal(GITHUB_URL)}
      />

      <PvListItem
        icon={<BookOpen size={18} />}
        primary={m.ui_settings_about_sources()}
        secondary={m.ui_settings_about_sources_desc()}
        onClick={() => openExternal(SOURCES_URL)}
      />
    </PvList>
  </PvCard>
);
