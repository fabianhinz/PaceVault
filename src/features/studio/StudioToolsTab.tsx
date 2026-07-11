import { m } from '@/paraglide/messages.js';
import { PageGrid } from '@/components/ui/PageGrid.tsx';
import { ActionPromptCard } from '@/components/ui/ActionPromptCard.tsx';

export const StudioToolsTab = () => (
  <PageGrid>
    <ActionPromptCard
      title={m.ui_studio_tools_empty_title()}
      description={m.ui_studio_tools_empty_desc()}
    />
  </PageGrid>
);
