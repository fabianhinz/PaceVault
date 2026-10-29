import { useState, type FC } from 'react';
import { ChevronDown, Contrast } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvResponsivePopover } from '@pacevault/ui/components/pvResponsivePopover/PvResponsivePopover.tsx';
import { PvRadioGroup } from '@pacevault/ui/components/pvRadioGroup/PvRadioGroup.tsx';
import { PvRadioGroupItem } from '@pacevault/ui/components/pvRadioGroup/PvRadioGroupItem.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { PvFloatingPill } from '@pacevault/ui/components/pvFloatingPill/PvFloatingPill.tsx';
import { PvResponsivePopoverHeading } from '@pacevault/ui/components/pvResponsivePopover/PvResponsivePopoverHeading.tsx';
import { TRACK_INTENSITIES, useMapPreferencesStore } from '@/store/mapPreferences.ts';
import { RampSwatch } from '@/components/mapBackground/RampSwatch.tsx';
import {
  DESCRIPTION_BY_TRACK_INTENSITY,
  LABEL_BY_TRACK_INTENSITY,
} from '@/microcopy/trackIntensity.ts';

export const TrackIntensityControl: FC = () => {
  const [open, setOpen] = useState(false);
  const intensity = useMapPreferencesStore((s) => s.trackIntensity);

  return (
    <PvResponsivePopover
      closeLabel={m.ui_sheet_drag_close()}
      open={open}
      onOpenChange={setOpen}
      title={m.ui_track_intensity()}
      icon={Contrast}
      side="top"
      align="center"
      className="lg:w-80"
      trigger={
        <PvFloatingPill data-testid="track-intensity-pill" className="h-11">
          <Contrast size={16} />
          <span className="grid">
            {TRACK_INTENSITIES.map((candidate) => (
              <span key={candidate} aria-hidden className="invisible [grid-area:1/1]">
                {LABEL_BY_TRACK_INTENSITY[candidate]()}
              </span>
            ))}
            <span className="text-left [grid-area:1/1]">
              {LABEL_BY_TRACK_INTENSITY[intensity]()}
            </span>
          </span>
          <ChevronDown size={14} className="text-text-tertiary" />
        </PvFloatingPill>
      }
    >
      <PvResponsivePopoverHeading icon={Contrast} title={m.ui_track_intensity()} />
      <PvRadioGroup
        value={intensity}
        onValueChange={(value) => {
          const next = TRACK_INTENSITIES.find((candidate) => candidate === value);
          if (next === undefined) return;
          useMapPreferencesStore.getState().setTrackIntensity(next);
          setOpen(false);
        }}
        className="gap-1"
      >
        {TRACK_INTENSITIES.map((candidate) => (
          <PvRadioGroupItem
            key={candidate}
            value={candidate}
            aria-label={LABEL_BY_TRACK_INTENSITY[candidate]()}
            className="rounded-lg px-2 py-2 hover:bg-white/5 data-[state=checked]:bg-white/5"
          >
            <span className="min-w-0 flex-1">
              <PvTypography variant="subtitle1" as="span" className="block">
                {LABEL_BY_TRACK_INTENSITY[candidate]()}
              </PvTypography>
              <PvTypography variant="caption" as="span" color="textTertiary" className="block">
                {DESCRIPTION_BY_TRACK_INTENSITY[candidate]()}
              </PvTypography>
            </span>
            <RampSwatch intensity={candidate} />
          </PvRadioGroupItem>
        ))}
      </PvRadioGroup>
    </PvResponsivePopover>
  );
};
