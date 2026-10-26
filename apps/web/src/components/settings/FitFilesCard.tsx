import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { PvCardHeader } from '@pacevault/ui/components/pvCardHeader/PvCardHeader.tsx';
import { FitUploadButton } from '@/components/sessions/FitUploadButton.tsx';

export const FitFilesCard: FC = () => (
  <PvCard>
    <PvCardHeader title={m.ui_fit_files_title()} subtitle={m.ui_fit_files_desc()} />
    <div className="flex justify-end">
      <FitUploadButton />
    </div>
  </PvCard>
);
