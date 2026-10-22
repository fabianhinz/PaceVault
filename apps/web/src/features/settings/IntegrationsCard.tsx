import { m } from '@pacevault/i18n/messages.js';
import { Card } from '@pacevault/ui/components/Card.tsx';
import { CardHeader } from '@pacevault/ui/components/CardHeader.tsx';
import { IntervalsConnectionForm } from '@/features/intervals/IntervalsConnectionForm.tsx';

export const IntegrationsCard = () => (
  <Card>
    <CardHeader title={m.ui_integrations_title()} subtitle={m.ui_integrations_desc()} />
    <IntervalsConnectionForm />
  </Card>
);
