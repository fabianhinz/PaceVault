import { useState } from 'react';
import { ChevronDown, Layers } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { ResponsivePopover } from '@/components/ui/ResponsivePopover.tsx';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { GlassPill } from '@/components/ui/GlassPill.tsx';
import { cn } from '@/lib/utils.ts';
import { tokens } from '@/lib/tokens.ts';
import { WIND_COLORS, ZONE_PALETTES } from '@/lib/zoneColors.ts';
import { SPEED_PALETTE, type SpeedScale } from '@/lib/speedScale.ts';
import type {
  ColorMode,
  ColorModeOption,
  ColorModeStatus,
  ColorModeUnavailableReason,
} from '@/lib/colorModes.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { speedRangeLabel } from './lapLabels.ts';
import type { Sport } from '@/packages/engine/types.ts';

const MODE_LABEL: Record<ColorMode, () => string> = {
  sport: m.ui_color_by_sport,
  hr: m.ui_color_by_hr,
  power: m.ui_color_by_power,
  pace: m.ui_color_by_pace,
  speed: m.ui_color_by_speed,
  wind: m.ui_color_by_wind,
};

const MODE_DESC: Record<Exclude<ColorMode, 'speed'>, () => string> = {
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
  speed: m.ui_color_by_pill_speed,
  wind: m.ui_color_by_pill_wind,
};

const REASON: Record<ColorModeUnavailableReason, () => string> = {
  hrThresholds: m.ui_color_by_reason_hrThresholds,
  ftp: m.ui_color_by_reason_ftp,
  thresholdPace: m.ui_color_by_reason_thresholdPace,
  noHrData: m.ui_color_by_reason_noHrData,
  noPowerData: m.ui_color_by_reason_noPowerData,
  noPaceData: m.ui_color_by_reason_noPaceData,
  noSpeedData: m.ui_color_by_reason_noSpeedData,
  noWeather: m.ui_color_by_reason_noWeather,
  weatherLoading: m.ui_color_by_reason_weatherLoading,
  noGps: m.ui_color_by_reason_noGps,
};

const SPORT_COLOR: Record<Sport, string> = {
  running: tokens.sportRunning,
  cycling: tokens.sportCycling,
};

const gradient = (colors: readonly string[]) => `linear-gradient(to right, ${colors.join(', ')})`;

const swatchBackground = (mode: ColorMode, sport: Sport): string => {
  if (mode === 'sport') return SPORT_COLOR[sport];
  if (mode === 'wind') return gradient([WIND_COLORS.tail, WIND_COLORS.cross, WIND_COLORS.head]);
  if (mode === 'speed') return gradient(SPEED_PALETTE);
  return gradient(ZONE_PALETTES[mode]);
};

const Swatch = (props: { mode: ColorMode; sport: Sport; muted?: boolean }) => (
  <span
    aria-hidden
    className={cn('h-2 w-12 shrink-0 rounded-full', props.muted && 'opacity-30 grayscale')}
    style={{ background: swatchBackground(props.mode, props.sport) }}
  />
);

const speedRange = (scale: SpeedScale | undefined): string => {
  if (!scale) return '';
  return speedRangeLabel(scale.slowKmh, scale.fastKmh);
};

const statusText = (
  mode: ColorMode,
  status: ColorModeStatus,
  speedScale: SpeedScale | undefined,
): string => {
  if (!status.available) return REASON[status.reason]();
  if (mode === 'speed') return m.ui_color_by_speed_desc({ range: speedRange(speedScale) });
  return MODE_DESC[mode]();
};

interface ColorByControlProps {
  sport: Sport;
  effective: ColorMode;
  options: ColorModeOption[];
  speedScale: SpeedScale | undefined;
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
        <GlassPill data-testid="color-by-pill">
          <Layers size={16} />
          <span>{PILL_LABEL[props.effective]()}</span>
          {props.effective !== 'sport' && <Swatch mode={props.effective} sport={props.sport} />}
          <ChevronDown size={14} className="text-text-tertiary" />
        </GlassPill>
      }
    >
      <div className="mb-3 flex items-center gap-2 text-text-tertiary">
        <Layers size={14} />
        <Typography variant="caption">{m.ui_color_by()}</Typography>
      </div>
      <RadioGroup
        value={props.effective}
        onValueChange={(value) => {
          const option = props.options.find((candidate) => candidate.mode === value);
          if (option === undefined) return;
          useMapFocusStore.getState().setSessionColorMode(option.mode);
          setOpen(false);
        }}
        className="gap-1"
      >
        {props.options.map((option) => (
          <RadioGroupItem
            key={option.mode}
            value={option.mode}
            disabled={!option.status.available}
            className="rounded-lg px-2 py-2 hover:bg-white/5 data-[state=checked]:bg-white/5"
          >
            <span className="min-w-0 flex-1">
              <Typography variant="subtitle1" as="span" className="block">
                {MODE_LABEL[option.mode]()}
              </Typography>
              <Typography variant="caption" as="span" color="textTertiary" className="block">
                {statusText(option.mode, option.status, props.speedScale)}
              </Typography>
            </span>
            <Swatch mode={option.mode} sport={props.sport} muted={!option.status.available} />
          </RadioGroupItem>
        ))}
      </RadioGroup>
    </ResponsivePopover>
  );
};
