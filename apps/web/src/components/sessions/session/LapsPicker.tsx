import type { FC } from 'react';
import { PageLink } from '@/routing/PageLink.tsx';
import { m } from '@pacevault/i18n/messages.js';
import { PvRadioGroup } from '@pacevault/ui/components/pvRadioGroup/PvRadioGroup.tsx';
import { PvRadioGroupItem } from '@pacevault/ui/components/pvRadioGroup/PvRadioGroupItem.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { PvChip } from '@pacevault/ui/components/pvChip/PvChip.tsx';
import type { LapSet, LapSource } from '@/lib/analysis/laps.ts';
import { useMapPreferencesStore } from '@/store/mapPreferences.ts';
import { LapSwatch } from './LapSwatch.tsx';
import { SplitSlider } from './SplitSlider.tsx';
import { lapsPickerDescriptions } from './lapLabels.ts';
import { useLapsPickerSets } from './hooks/useLapsPickerSets.ts';
import type { LapsControlProps } from './types.ts';

const rowClass =
  'rounded-lg px-2 py-2 hover:bg-white/5 group-data-[checked]/row:hover:bg-transparent';

interface LapsPickerProps extends LapsControlProps {
  source: LapSource;
  splitDistance: number;
  current: LapSet | null;
  onDone: () => void;
}

export const LapsPicker: FC<LapsPickerProps> = (props) => {
  const source = props.source;
  const sets = useLapsPickerSets(props);
  const descriptions = lapsPickerDescriptions({
    source,
    current: props.current,
    deviceLapCount: props.laps.length,
    effortSet: sets.effortSet,
    limitedBy: sets.limitedBy,
  });
  const deviceLapsPresent = props.laps.length > 0;

  const rows: Array<{
    value: LapSource;
    title: string;
    desc: string;
    set: LapSet | null;
    disabled: boolean;
  }> = [
    {
      value: 'off',
      title: m.ui_laps_off(),
      desc: m.ui_laps_off_desc(),
      set: null,
      disabled: false,
    },
    {
      value: 'device',
      title: m.ui_laps_device(),
      desc: descriptions.deviceDescription,
      set: sets.deviceSet,
      disabled: !deviceLapsPresent,
    },
    {
      value: 'splits',
      title: m.ui_laps_splits(),
      desc: descriptions.splitsDescription,
      set: sets.splitSet,
      disabled: false,
    },
  ];

  return (
    <PvRadioGroup
      value={source}
      onValueChange={(value) => {
        if (value === 'off' || value === 'device' || value === 'efforts') {
          useMapPreferencesStore
            .getState()
            .setSessionLapSource({ sport: props.sport, source: value });
          props.onDone();
          return;
        }
        if (value === 'splits')
          useMapPreferencesStore
            .getState()
            .setSessionLapSource({ sport: props.sport, source: 'splits' });
      }}
      className="gap-1"
    >
      {rows.map((item) => (
        <div
          key={item.value}
          data-checked={source === item.value ? '' : undefined}
          className="group/row rounded-lg data-[checked]:bg-white/5"
        >
          <PvRadioGroupItem
            value={item.value}
            disabled={item.disabled}
            aria-label={item.title}
            className={rowClass}
          >
            <span className="min-w-0 flex-1">
              <PvTypography variant="subtitle1" as="span" className="block">
                {item.title}
              </PvTypography>
              <PvTypography variant="caption" as="span" color="textTertiary" className="block">
                {item.desc}
              </PvTypography>
            </span>
            <LapSwatch set={item.set} muted={item.disabled} />
          </PvRadioGroupItem>
          {item.value === 'splits' && source === 'splits' && (
            <SplitSlider records={props.records} sport={props.sport} value={props.splitDistance} />
          )}
        </div>
      ))}
      <div
        data-checked={source === 'efforts' ? '' : undefined}
        data-testid="laps-efforts-row"
        className="group/row relative rounded-lg hover:bg-white/5 data-[checked]:bg-white/5"
      >
        <PvRadioGroupItem
          value="efforts"
          disabled={sets.effortSet === null}
          aria-label={m.ui_laps_efforts()}
          className="rounded-lg px-2 pt-2 pb-8"
        >
          <span className="min-w-0 flex-1">
            <PvTypography variant="subtitle1" as="span" className="block">
              {m.ui_laps_efforts()}
            </PvTypography>
            <span className="flex h-5 min-w-0 items-center">
              {descriptions.effortLabel === undefined ? (
                <PvTypography
                  variant="caption"
                  as="span"
                  color="textTertiary"
                  className="block truncate"
                >
                  {m.ui_laps_efforts_none()}
                </PvTypography>
              ) : (
                <PvChip title={descriptions.effortLabel} className="min-w-0 truncate">
                  {descriptions.effortLabel}
                </PvChip>
              )}
            </span>
          </span>
          <LapSwatch set={sets.effortSet} muted={sets.effortSet === null} />
        </PvRadioGroupItem>
        {descriptions.nudge !== '' && (
          <PageLink
            to={{ page: 'settings', params: {} }}
            className="absolute bottom-2 left-10 max-w-[calc(100%-3rem)] truncate text-xs leading-4 text-accent hover:underline"
          >
            {descriptions.nudge}
          </PageLink>
        )}
      </div>
    </PvRadioGroup>
  );
};
