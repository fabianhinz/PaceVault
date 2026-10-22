import { CodeXml, BookOpen } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { Card } from '@pacevault/ui/components/Card.tsx';
import { CardHeader } from '@pacevault/ui/components/CardHeader.tsx';
import { List, ListItem } from '@pacevault/ui/components/List.tsx';
import { Typography } from '@pacevault/ui/components/Typography.tsx';

export const GITHUB_URL = 'https://github.com/fabianhinz/PaceVault';
const SOURCES_URL = 'https://github.com/fabianhinz/PaceVault/blob/main/packages/engine/SOURCES.md';

const openExternal = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

export const AboutSection = () => (
  <Card
    footer={
      <div className="flex justify-end">
        <Typography variant="caption">
          {m.ui_settings_about_version()}: {import.meta.env.VITE_APP_COMMIT}
        </Typography>
      </div>
    }
  >
    <CardHeader title={m.ui_settings_about_title()} subtitle={m.ui_settings_about_desc()} />
    <List>
      <ListItem
        icon={<CodeXml size={18} />}
        primary={m.ui_settings_about_github()}
        secondary={m.ui_settings_about_github_desc()}
        onClick={() => openExternal(GITHUB_URL)}
      />

      <ListItem
        icon={<BookOpen size={18} />}
        primary={m.ui_settings_about_sources()}
        secondary={m.ui_settings_about_sources_desc()}
        onClick={() => openExternal(SOURCES_URL)}
      />
    </List>
  </Card>
);
