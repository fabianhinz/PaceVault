import { useState } from 'react';
import { ChevronDown, Contrast } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { ResponsivePopover } from '@/components/ui/ResponsivePopover.tsx';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { FloatingPill } from '@/components/ui/FloatingPill.tsx';
import { useMapControlsStore, type TrackIntensity } from '@/store/mapControls.ts';
import { TRACK_INTENSITIES, sportTrackColor, trackIntensityAlpha } from './trackColors.ts';

const INTENSITY_LABEL: Record<TrackIntensity, () => string> = {
  faint: m.ui_track_intensity_faint,
  warm: m.ui_track_intensity_warm,
  hot: m.ui_track_intensity_hot,
};

const INTENSITY_DESC: Record<TrackIntensity, () => string> = {
  faint: m.ui_track_intensity_faint_desc,
  warm: m.ui_track_intensity_warm_desc,
  hot: m.ui_track_intensity_hot_desc,
};

const RAMP_BASE = 14;
const RAMP_STOPS = 10;
const RAMP_MAX_PASSES = 10;
const RAMP_SPORTS = [sportTrackColor.running, sportTrackColor.cycling];

const rampGradient = (rgb: [number, number, number], alpha: number) => {
  const stops: string[] = [];
  for (let index = 0; index < RAMP_STOPS; index++) {
    const share = index / (RAMP_STOPS - 1);
    const passes = 1 + (RAMP_MAX_PASSES - 1) * share;
    const channels = rgb.map((channel) =>
      Math.round(Math.min(255, RAMP_BASE + passes * channel * (alpha / 255))),
    );
    stops.push(`rgb(${channels.join(', ')}) ${share * 100}%`);
  }
  return `linear-gradient(to right, ${stops.join(', ')})`;
};

const RampSwatch = (props: { intensity: TrackIntensity }) => (
  <span aria-hidden className="flex h-2 w-12 shrink-0 flex-col overflow-hidden rounded-full">
    {RAMP_SPORTS.map((rgb) => (
      <span
        key={rgb.join()}
        className="flex-1"
        style={{ background: rampGradient(rgb, trackIntensityAlpha[props.intensity]) }}
      />
    ))}
  </span>
);

export const TrackIntensityControl = () => {
  const [open, setOpen] = useState(false);
  const intensity = useMapControlsStore((s) => s.trackIntensity);

  return (
    <ResponsivePopover
      open={open}
      onOpenChange={setOpen}
      title={m.ui_track_intensity()}
      icon={Contrast}
      side="top"
      align="center"
      className="lg:w-80"
      trigger={
        <FloatingPill data-testid="track-intensity-pill" className="h-11">
          <Contrast size={16} />
          <span className="grid">
            {TRACK_INTENSITIES.map((candidate) => (
              <span key={candidate} aria-hidden className="invisible [grid-area:1/1]">
                {INTENSITY_LABEL[candidate]()}
              </span>
            ))}
            <span className="text-left [grid-area:1/1]">{INTENSITY_LABEL[intensity]()}</span>
          </span>
          <ChevronDown size={14} className="text-text-tertiary" />
        </FloatingPill>
      }
    >
      <div className="mb-3 flex items-center gap-2 text-text-tertiary max-lg:hidden">
        <Contrast size={14} />
        <Typography variant="caption">{m.ui_track_intensity()}</Typography>
      </div>
      <RadioGroup
        value={intensity}
        onValueChange={(value) => {
          const next = TRACK_INTENSITIES.find((candidate) => candidate === value);
          if (next === undefined) return;
          useMapControlsStore.getState().setTrackIntensity(next);
          setOpen(false);
        }}
        className="gap-1"
      >
        {TRACK_INTENSITIES.map((candidate) => (
          <RadioGroupItem
            key={candidate}
            value={candidate}
            className="rounded-lg px-2 py-2 hover:bg-white/5 data-[state=checked]:bg-white/5"
          >
            <span className="min-w-0 flex-1">
              <Typography variant="subtitle1" as="span" className="block">
                {INTENSITY_LABEL[candidate]()}
              </Typography>
              <Typography variant="caption" as="span" color="textTertiary" className="block">
                {INTENSITY_DESC[candidate]()}
              </Typography>
            </span>
            <RampSwatch intensity={candidate} />
          </RadioGroupItem>
        ))}
      </RadioGroup>
    </ResponsivePopover>
  );
};
