import { m } from '@pacevault/i18n/messages.js';
import { Card } from '@pacevault/ui/components/Card.tsx';
import { CardHeader } from '@pacevault/ui/components/CardHeader.tsx';
import { FitUploadButton } from '@/features/sessions/FitUploadButton.tsx';

export const FitFilesCard = () => (
  <Card>
    <CardHeader title={m.ui_fit_files_title()} subtitle={m.ui_fit_files_desc()} />
    <div className="flex justify-end">
      <FitUploadButton />
    </div>
  </Card>
);
