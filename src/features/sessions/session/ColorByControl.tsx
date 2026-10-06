import { useState } from 'react';
import { ChevronDown, Layers } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { ResponsivePopover } from '@/components/ui/ResponsivePopover.tsx';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { cn } from '@/lib/utils.ts';
import { glassClass } from '@/components/ui/Card.tsx';
import { tokens } from '@/lib/tokens.ts';
import { WIND_COLORS, ZONE_PALETTES } from '@/lib/zoneColors.ts';
import {
  COLOR_MODES,
  type ColorMode,
  type ColorModeStatus,
  type ColorModeUnavailableReason,
} from '@/lib/colorModes.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import type { Sport } from '@/packages/engine/types.ts';

const MODE_LABEL: Record<ColorMode, () => string> = {
  sport: m.ui_color_by_sport,
  hr: m.ui_color_by_hr,
  power: m.ui_color_by_power,
  pace: m.ui_color_by_pace,
  wind: m.ui_color_by_wind,
};

const MODE_DESC: Record<ColorMode, () => string> = {
  sport: m.ui_color_by_sport_desc,
  hr: m.ui_color_by_hr_desc,
  power: m.ui_color_by_power_desc,
  pace: m.ui_color_by_pace_desc,
  wind: m.ui_color_by_wind_desc,
};

const PILL_LABEL: Record<ColorMode, () => string> = {
  sport: m.ui_color_by,
  hr: m.ui_color_by_pill_hr,
  power: m.ui_color_by_pill_power,
  pace: m.ui_color_by_pill_pace,
  wind: m.ui_color_by_pill_wind,
};

const REASON: Record<ColorModeUnavailableReason, () => string> = {
  hrThresholds: m.ui_color_by_reason_hrThresholds,
  ftp: m.ui_color_by_reason_ftp,
  thresholdPace: m.ui_color_by_reason_thresholdPace,
  runningOnly: m.ui_color_by_reason_runningOnly,
  noHrData: m.ui_color_by_reason_noHrData,
  noPowerData: m.ui_color_by_reason_noPowerData,
  noPaceData: m.ui_color_by_reason_noPaceData,
  noWeather: m.ui_color_by_reason_noWeather,
  weatherLoading: m.ui_color_by_reason_weatherLoading,
  noGps: m.ui_color_by_reason_noGps,
};

const SPORT_COLOR: Record<Sport, string> = {
  running: tokens.sportRunning,
  cycling: tokens.sportCycling,
};

const swatchBackground = (mode: ColorMode, sport: Sport): string => {
  if (mode === 'sport') return SPORT_COLOR[sport];
  if (mode === 'wind') {
    return `linear-gradient(to right, ${WIND_COLORS.tail}, ${WIND_COLORS.cross}, ${WIND_COLORS.head})`;
  }
  return `linear-gradient(to right, ${ZONE_PALETTES[mode].join(', ')})`;
};

const Swatch = (props: { mode: ColorMode; sport: Sport; muted?: boolean }) => (
  <span
    aria-hidden
    className={cn('h-2 w-12 shrink-0 rounded-full', props.muted && 'opacity-30 grayscale')}
    style={{ background: swatchBackground(props.mode, props.sport) }}
  />
);

const statusText = (mode: ColorMode, status: ColorModeStatus): string => {
  if (status.available) return MODE_DESC[mode]();
  return REASON[status.reason]();
};

interface ColorByControlProps {
  sport: Sport;
  effective: ColorMode;
  statuses: Record<ColorMode, ColorModeStatus>;
}

export const ColorByControl = (props: ColorByControlProps) => {
  const [open, setOpen] = useState(false);

  return (
    <ResponsivePopover
      open={open}
      onOpenChange={setOpen}
      title={m.ui_color_by()}
      side="top"
      align="center"
      className="lg:w-80"
      trigger={
        <button
          type="button"
          data-testid="color-by-pill"
          className={cn(
            glassClass,
            'pointer-events-auto inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-2',
            'text-sm text-text-primary transition-colors hover:bg-white/10',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          )}
        >
          <Layers size={16} />
          <span>{PILL_LABEL[props.effective]()}</span>
          {props.effective !== 'sport' && <Swatch mode={props.effective} sport={props.sport} />}
          <ChevronDown size={14} className="text-text-tertiary" />
        </button>
      }
    >
      <div className="mb-3 flex items-center gap-2 text-text-tertiary">
        <Layers size={14} />
        <Typography variant="caption">{m.ui_color_by()}</Typography>
      </div>
      <RadioGroup
        value={props.effective}
        onValueChange={(value) => {
          const mode = COLOR_MODES.find((candidate) => candidate === value);
          if (mode === undefined) return;
          useMapFocusStore.getState().setSessionColorMode(mode);
          setOpen(false);
        }}
        className="gap-1"
      >
        {COLOR_MODES.map((mode) => {
          const status = props.statuses[mode];
          return (
            <RadioGroupItem
              key={mode}
              value={mode}
              disabled={!status.available}
              className="rounded-lg px-2 py-2 hover:bg-white/5 data-[state=checked]:bg-white/5"
            >
              <span className="min-w-0 flex-1">
                <Typography variant="subtitle1" as="span" className="block">
                  {MODE_LABEL[mode]()}
                </Typography>
                <Typography variant="caption" as="span" color="textTertiary" className="block">
                  {statusText(mode, status)}
                </Typography>
              </span>
              <Swatch mode={mode} sport={props.sport} muted={!status.available} />
            </RadioGroupItem>
          );
        })}
      </RadioGroup>
    </ResponsivePopover>
  );
};
