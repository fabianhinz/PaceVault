import { m } from '@/paraglide/messages.js';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { FitUploadButton } from '@/features/sessions/FitUploadButton.tsx';

export const FitFilesCard = () => (
  <Card>
    <CardHeader title={m.ui_fit_files_title()} subtitle={m.ui_fit_files_desc()} />
    <div className="flex justify-end">
      <FitUploadButton />
    </div>
  </Card>
);
