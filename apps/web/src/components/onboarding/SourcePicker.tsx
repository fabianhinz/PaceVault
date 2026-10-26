import type { FC } from 'react';
import { CloudDownload, Database, FolderUp, type LucideIcon } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { useOnboardingStore, type OnboardingSource } from '@/store/onboarding.ts';
import { PvActionTile } from '@pacevault/ui/components/pvActionTile/PvActionTile.tsx';

interface SourceOption {
  id: OnboardingSource | 'demo';
  icon: LucideIcon;
  title: () => string;
  description: () => string;
}

const SOURCES: SourceOption[] = [
  {
    id: 'intervals',
    icon: CloudDownload,
    title: m.ui_onboarding_intervals_title,
    description: m.ui_onboarding_intervals_desc,
  },
  {
    id: 'fit',
    icon: FolderUp,
    title: m.ui_fit_files_title,
    description: m.ui_onboarding_fit_desc,
  },
  {
    id: 'demo',
    icon: Database,
    title: m.ui_onboarding_demo_title,
    description: m.ui_onboarding_demo_desc,
  },
];
const pickSource = ({ id, onDemo }: { id: SourceOption['id']; onDemo: () => void }) => {
  if (id === 'demo') {
    onDemo();
    return;
  }
  useOnboardingStore.getState().chooseOnboardingSource(id);
};

interface SourcePickerProps {
  onDemo: () => void;
}

export const SourcePicker: FC<SourcePickerProps> = (props) => (
  <div className="flex flex-col gap-2">
    {SOURCES.map((option) => (
      <PvActionTile
        key={option.id}
        icon={option.icon}
        title={option.title()}
        description={option.description()}
        onClick={() => pickSource({ id: option.id, onDemo: props.onDemo })}
      />
    ))}
  </div>
);
