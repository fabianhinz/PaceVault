import { useState } from 'react';
import { Database, FolderUp, CloudDownload } from 'lucide-react';
import { useSessionsStore } from '@/store/sessions.ts';
import { useLayoutStore } from '@/store/layout.ts';
import { useUploadProgressStore } from '@/store/uploadProgress.ts';
import { FitUploadButton } from '@/features/sessions/FitUploadButton.tsx';

import { generateDevData } from '@/features/dashboard/generateDevData.ts';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/Button.tsx';
import { ActionTile } from '@/components/ui/ActionTile.tsx';
import { ThresholdsSection } from '@/features/settings/ThresholdsSection.tsx';
import { ActionPromptCard } from '@/components/ui/ActionPromptCard.tsx';
import { IntervalsConnectionForm } from '@/features/intervals/IntervalsConnectionForm.tsx';

type OnboardingPath = 'intervals' | 'your-data' | 'test-data' | null;

export const OnboardingPage = () => {
  const uploading = useUploadProgressStore((s) => s.uploading);

  const [path, setPath] = useState<OnboardingPath>(null);

  const handleGenerate = async () => {
    try {
      await generateDevData();
      useLayoutStore.getState().completeOnboarding();
      useLayoutStore.getState().setDemoMode(true);
    } catch {
      useUploadProgressStore.getState().finish(m.ui_onboarding_testdata_failed(), 'error');
    }
  };

  return (
    <ActionPromptCard
      title={m.ui_onboarding_welcome_title()}
      description={m.ui_onboarding_welcome_desc()}
      className="bg-[linear-gradient(color-mix(in_srgb,var(--color-surface-base)_90%,transparent),color-mix(in_srgb,var(--color-surface-base)_90%,transparent)),url('/logo.svg')] bg-surface-base bg-left-top bg-no-repeat bg-[length:12rem] p-5"
    >
      <hr className="border-white/10 w-full" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
        <ActionTile
          icon={CloudDownload}
          title={m.ui_onboarding_intervals_title()}
          description={m.ui_onboarding_intervals_desc()}
          selected={path === 'intervals'}
          onClick={() => setPath('intervals')}
        />
        <ActionTile
          icon={FolderUp}
          title={m.ui_fit_files_title()}
          description={m.ui_fit_files_desc()}
          selected={path === 'your-data'}
          onClick={() => setPath('your-data')}
        />
        <ActionTile
          icon={Database}
          title={m.ui_onboarding_testdata_title()}
          description={m.ui_onboarding_testdata_desc()}
          selected={path === 'test-data'}
          className="col-span-2 sm:col-span-1"
          onClick={() => setPath('test-data')}
        />
      </div>

      {path === 'your-data' && (
        <div className="w-full">
          <ThresholdsSection variant="embedded" />
        </div>
      )}

      {path === 'intervals' && (
        <div className="w-full">
          <IntervalsConnectionForm
            onSynced={() => {
              useLayoutStore.getState().completeOnboarding();
            }}
          >
            <ThresholdsSection variant="embedded" />
          </IntervalsConnectionForm>
        </div>
      )}

      {path !== null && path !== 'intervals' && (
        <div className="flex justify-end w-full">
          {path === 'your-data' ? (
            <FitUploadButton
              onUploaded={() => {
                if (useSessionsStore.getState().sessions.length > 0) {
                  useLayoutStore.getState().completeOnboarding();
                }
              }}
            />
          ) : (
            <Button onClick={handleGenerate} loading={uploading}>
              {uploading
                ? m.ui_onboarding_testdata_generating()
                : m.ui_onboarding_testdata_generate()}
            </Button>
          )}
        </div>
      )}
    </ActionPromptCard>
  );
};
