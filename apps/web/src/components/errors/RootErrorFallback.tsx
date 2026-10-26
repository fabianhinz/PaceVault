import type { FC } from 'react';
import { RefreshCw } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvActionPromptCard } from '@pacevault/ui/components/pvActionPromptCard/PvActionPromptCard.tsx';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { FallbackActions } from '@/components/errors/FallbackActions.tsx';
import { ReportBugButton } from '@/components/errors/ReportBugButton.tsx';

interface RootErrorFallbackProps {
  error: unknown;
}

export const RootErrorFallback: FC<RootErrorFallbackProps> = (props) => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <PvActionPromptCard
      title={m.ui_error_root_title()}
      description={m.ui_error_root_desc()}
      branded
      className="w-full max-w-2xl p-5"
    >
      <FallbackActions>
        <ReportBugButton error={props.error} />
        <PvButton onClick={() => window.location.reload()}>
          <RefreshCw className="size-4" />
          {m.ui_btn_reload()}
        </PvButton>
      </FallbackActions>
    </PvActionPromptCard>
  </div>
);
