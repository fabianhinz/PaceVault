import type { FC } from 'react';
import { Info } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvExternalLink } from '@pacevault/ui/components/pvExternalLink/PvExternalLink.tsx';
import { PvInput } from '@pacevault/ui/components/pvInput/PvInput.tsx';
import { PvLabel } from '@pacevault/ui/components/pvLabel/PvLabel.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { useIntervalsStore } from '@/store/intervals.ts';
import { useUserStore } from '@/store/user.ts';
import type { ProfileGate } from '@/components/settings/hooks/types.ts';
import { IntervalsStatusLine } from './IntervalsStatusLine.tsx';
import { useIntervalsKeyInput } from './hooks/useIntervalsKeyInput.ts';
import { useIntervalsImport } from './hooks/useIntervalsImport.ts';

const SETTINGS_URL = 'https://intervals.icu/settings';

interface IntervalsProps {
  onSynced?: () => void;
  profileGate?: ProfileGate;
}

export const Intervals: FC<IntervalsProps> = (props) => {
  const storedKey = useIntervalsStore((s) => s.apiKey);
  const profilePresent = useUserStore((s) => s.profile !== null);
  let profileReady = profilePresent;
  if (props.profileGate) profileReady = props.profileGate.ready;

  const keyInput = useIntervalsKeyInput(storedKey);
  const intervalsImport = useIntervalsImport({
    keyInput: keyInput.value,
    onSynced: props.onSynced,
    profileGate: props.profileGate,
  });

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-0.5">
        <PvTypography variant="subtitle1">{m.ui_onboarding_intervals_title()}</PvTypography>
        <div className="h-8">
          <IntervalsStatusLine error={intervalsImport.error} check={keyInput.check} />
        </div>
      </div>

      <div>
        <PvLabel htmlFor="intervals-api-key">{m.ui_intervals_connect_label()}</PvLabel>
        <PvInput
          id="intervals-api-key"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={keyInput.value}
          disabled={intervalsImport.manual}
          onPaste={keyInput.markPaste}
          onChange={(e) => {
            intervalsImport.clearError();
            keyInput.change(e.target.value);
          }}
          helperText={
            <PvExternalLink href={SETTINGS_URL} icon={Info}>
              {m.ui_intervals_connect_help()}
            </PvExternalLink>
          }
        />
      </div>

      <div className="flex justify-end">
        <PvButton
          onClick={() => void intervalsImport.handleImport()}
          loading={intervalsImport.manual}
          disabled={
            intervalsImport.manual ||
            keyInput.trimmed === '' ||
            !profileReady ||
            keyInput.check?.kind === 'checking' ||
            keyInput.check?.kind === 'rejected'
          }
        >
          {intervalsImport.manual
            ? m.ui_intervals_importing_short()
            : m.ui_intervals_import_activities()}
        </PvButton>
      </div>
    </div>
  );
};
