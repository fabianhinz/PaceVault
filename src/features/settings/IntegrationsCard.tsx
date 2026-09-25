import { m } from '@/paraglide/messages.js';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { IntervalsConnectionForm } from '@/features/intervals/IntervalsConnectionForm.tsx';

export const IntegrationsCard = () => (
  <Card>
    <CardHeader title={m.ui_integrations_title()} subtitle={m.ui_integrations_desc()} />
    <IntervalsConnectionForm />
  </Card>
);
