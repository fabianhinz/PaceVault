import { useState, type FC } from 'react';
import { ChevronDown, Layers } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvResponsivePopover } from '@pacevault/ui/components/pvResponsivePopover/PvResponsivePopover.tsx';
import { PvRadioGroup } from '@pacevault/ui/components/pvRadioGroup/PvRadioGroup.tsx';
import { PvRadioGroupItem } from '@pacevault/ui/components/pvRadioGroup/PvRadioGroupItem.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { PvFloatingPill } from '@pacevault/ui/components/pvFloatingPill/PvFloatingPill.tsx';
import { PvResponsivePopoverHeading } from '@pacevault/ui/components/pvResponsivePopover/PvResponsivePopoverHeading.tsx';
import type { SpeedScale } from '@/lib/colors/speedScale.ts';
import type { ColorMode, ColorModeOption, ColorModeStatus } from '@/lib/colors/colorModes.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { useMapPreferencesStore } from '@/store/mapPreferences.ts';
import { speedRangeLabel } from './lapLabels.ts';
import { Swatch } from './Swatch.tsx';
import type { Sport } from '@pacevault/engine/types.ts';
import {
  COMPACT_LABEL_BY_COLOR_MODE,
  DESCRIPTION_BY_COLOR_MODE,
  LABEL_BY_COLOR_MODE,
  PILL_LABEL_BY_COLOR_MODE,
  REASON_BY_UNAVAILABLE_COLOR_MODE,
} from '@/microcopy/colorModes.ts';

const speedRange = (scale: SpeedScale | undefined): string => {
  if (!scale) return '';
  return speedRangeLabel({ slowKmh: scale.slowKmh, fastKmh: scale.fastKmh });
};

const statusText = ({
  mode,
  status,
  speedScale,
}: {
  mode: ColorMode;
  status: ColorModeStatus;
  speedScale: SpeedScale | undefined;
}): string => {
  if (!status.available) return REASON_BY_UNAVAILABLE_COLOR_MODE[status.reason]();
  if (mode === 'speed') return m.ui_color_by_speed_desc({ range: speedRange(speedScale) });
  return DESCRIPTION_BY_COLOR_MODE[mode]();
};

interface ColorByControlProps {
  sport: Sport;
  effective: ColorMode;
  options: ColorModeOption[];
  speedScale: SpeedScale | undefined;
}

export const ColorByControl: FC<ColorByControlProps> = (props) => {
  const [open, setOpen] = useState(false);
  const lapSelected = useMapControlsStore((s) => s.selectedLapIndex !== null);

  return (
    <PvResponsivePopover
      closeLabel={m.ui_sheet_drag_close()}
      open={open}
      onOpenChange={setOpen}
      title={m.ui_color_by()}
      icon={Layers}
      side="top"
      align="center"
      className="lg:w-80"
      trigger={
        lapSelected ? (
          <PvFloatingPill
            data-testid="color-by-pill"
            aria-label={m.ui_color_by_compact_label({
              mode: COMPACT_LABEL_BY_COLOR_MODE[props.effective](),
            })}
            className="size-11 justify-center p-0"
          >
            <Layers size={16} />
          </PvFloatingPill>
        ) : (
          <PvFloatingPill data-testid="color-by-pill" className="h-11">
            <Layers size={16} />
            <span>{PILL_LABEL_BY_COLOR_MODE[props.effective]()}</span>
            {props.effective !== 'sport' && <Swatch mode={props.effective} sport={props.sport} />}
            <ChevronDown size={14} className="text-text-tertiary" />
          </PvFloatingPill>
        )
      }
    >
      <PvResponsivePopoverHeading icon={Layers} title={m.ui_color_by()} />
      <PvRadioGroup
        value={props.effective}
        onValueChange={(value) => {
          const option = props.options.find((candidate) => candidate.mode === value);
          if (option === undefined) return;
          useMapPreferencesStore
            .getState()
            .setSessionColorMode({ sport: props.sport, mode: option.mode });
          setOpen(false);
        }}
        className="gap-1"
      >
        {props.options.map((option) => (
          <PvRadioGroupItem
            key={option.mode}
            value={option.mode}
            aria-label={LABEL_BY_COLOR_MODE[option.mode]()}
            disabled={!option.status.available}
            className="rounded-lg px-2 py-2 hover:bg-white/5 data-[state=checked]:bg-white/5"
          >
            <span className="min-w-0 flex-1">
              <PvTypography variant="subtitle1" as="span" className="block">
                {LABEL_BY_COLOR_MODE[option.mode]()}
              </PvTypography>
              <PvTypography variant="caption" as="span" color="textTertiary" className="block">
                {statusText({
                  mode: option.mode,
                  status: option.status,
                  speedScale: props.speedScale,
                })}
              </PvTypography>
            </span>
            <Swatch mode={option.mode} sport={props.sport} muted={!option.status.available} />
          </PvRadioGroupItem>
        ))}
      </PvRadioGroup>
    </PvResponsivePopover>
  );
};
