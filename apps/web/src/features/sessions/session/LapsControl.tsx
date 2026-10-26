import { useState, type FC } from 'react';
import { ChevronDown, Flag } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvResponsivePopover } from '@pacevault/ui/components/pvResponsivePopover/PvResponsivePopover.tsx';
import { PvFloatingPill } from '@pacevault/ui/components/pvFloatingPill/PvFloatingPill.tsx';
import { PvResponsivePopoverHeading } from '@pacevault/ui/components/pvResponsivePopover/PvResponsivePopoverHeading.tsx';
import { effortWorkCount, type LapSet, type LapSource } from '@/lib/laps.ts';
import { LapSwatch } from './LapSwatch.tsx';
import { LapStepper } from './LapStepper.tsx';
import { LapsPicker } from './LapsPicker.tsx';
import { lapCountLabel } from './lapLabels.ts';
import { useLapsControlState } from './hooks/useLapsControlState.ts';
import type { LapsControlProps } from './types.ts';

const pillLabel = ({ source, set }: { source: LapSource; set: LapSet | null }): string => {
  if (!set || source === 'off') return m.ui_laps();
  if (source === 'efforts')
    return lapCountLabel({ count: effortWorkCount(set), source: 'efforts' });
  return lapCountLabel({ count: set.analysis.length, source });
};

export const LapsControl: FC<LapsControlProps> = (props) => {
  const [open, setOpen] = useState(false);
  const lapsState = useLapsControlState(props);
  const source = lapsState.source;
  const sessionLaps = lapsState.sessionLaps;

  if (lapsState.hasSelectedLap && sessionLaps && lapsState.selected !== null) {
    return (
      <LapStepper
        set={sessionLaps}
        lapIndex={lapsState.selected}
        source={source}
        sport={props.sport}
      />
    );
  }

  return (
    <PvResponsivePopover
      closeLabel={m.ui_sheet_drag_close()}
      open={open}
      onOpenChange={setOpen}
      title={m.ui_laps()}
      icon={Flag}
      side="top"
      align="center"
      className="lg:w-80"
      trigger={
        <PvFloatingPill data-testid="laps-pill" className="h-11">
          <Flag size={16} />
          <span>{pillLabel({ source, set: sessionLaps })}</span>
          {source !== 'off' && sessionLaps && <LapSwatch set={sessionLaps} />}
          <ChevronDown size={14} className="text-text-tertiary" />
        </PvFloatingPill>
      }
    >
      <PvResponsivePopoverHeading icon={Flag} title={m.ui_laps()} />
      <LapsPicker
        records={props.records}
        laps={props.laps}
        sport={props.sport}
        date={props.date}
        source={source}
        splitDistance={lapsState.splitDistance}
        current={sessionLaps}
        onDone={() => setOpen(false)}
      />
    </PvResponsivePopover>
  );
};
