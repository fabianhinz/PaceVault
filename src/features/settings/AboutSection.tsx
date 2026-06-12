import { Code, BookOpen } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { List, ListItem } from '@/components/ui/List.tsx';
import { Typography } from '@/components/ui/Typography';

const GITHUB_URL = 'https://github.com/fabianhinz/PaceVault';
const SOURCES_URL =
  'https://github.com/fabianhinz/PaceVault/blob/main/src/packages/engine/SOURCES.md';

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
        icon={<Code size={18} />}
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
