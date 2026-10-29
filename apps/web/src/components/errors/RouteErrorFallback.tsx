import type { FC } from 'react';
import type { FallbackProps } from 'react-error-boundary';
import { RotateCcw } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvActionPromptCard } from '@pacevault/ui/components/pvActionPromptCard/PvActionPromptCard.tsx';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { FallbackActions } from '@/components/errors/FallbackActions.tsx';
import { ReportBugButton } from '@/components/errors/ReportBugButton.tsx';

export const RouteErrorFallback: FC<FallbackProps> = (props) => (
  <PvActionPromptCard
    title={m.ui_error_route_title()}
    description={m.ui_error_route_desc()}
    className="p-5"
  >
    <FallbackActions>
      <ReportBugButton error={props.error} />
      <PvButton onClick={props.resetErrorBoundary}>
        <RotateCcw className="size-4" />
        {m.ui_error_try_again()}
      </PvButton>
    </FallbackActions>
  </PvActionPromptCard>
);
