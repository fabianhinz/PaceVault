import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { useLayoutStore } from '@/store/layout.ts';
import { m } from '@pacevault/i18n/messages.js';
import { Banner } from '@pacevault/ui/components/Banner.tsx';
import { Button } from '@pacevault/ui/components/Button.tsx';
import { DeleteAllDataDialog } from '@/features/settings/DeleteAllDataDialog.tsx';

export const DemoBanner = () => {
  const demoMode = useLayoutStore((s) => s.demoMode);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!demoMode) return null;

  return (
    <>
      <Banner
        className="mb-4"
        variant="warning"
        icon={FlaskConical}
        action={
          <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(true)}>
            {m.ui_demo_banner_action()}
          </Button>
        }
      >
        {m.ui_demo_banner_text()}
      </Banner>
      <DeleteAllDataDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
};
