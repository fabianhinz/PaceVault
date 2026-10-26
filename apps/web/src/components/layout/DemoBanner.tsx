import { useState, type FC } from 'react';
import { FlaskConical } from 'lucide-react';
import { useLayoutStore } from '@/store/layout.ts';
import { m } from '@pacevault/i18n/messages.js';
import { PvBanner } from '@pacevault/ui/components/pvBanner/PvBanner.tsx';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { DeleteAllDataDialog } from '@/features/settings/DeleteAllDataDialog.tsx';

export const DemoBanner: FC = () => {
  const demoMode = useLayoutStore((s) => s.demoMode);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!demoMode) return null;

  return (
    <>
      <PvBanner
        className="mb-4"
        variant="warning"
        icon={FlaskConical}
        action={
          <PvButton variant="ghost" size="sm" onClick={() => setDeleteOpen(true)}>
            {m.ui_demo_banner_action()}
          </PvButton>
        }
      >
        {m.ui_demo_banner_text()}
      </PvBanner>
      <DeleteAllDataDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
};
