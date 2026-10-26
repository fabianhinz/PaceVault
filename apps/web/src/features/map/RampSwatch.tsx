import type { FC } from 'react';
import type { TrackIntensity } from '@/store/mapPreferences.ts';
import { sportTrackColor, trackIntensityAlpha } from '@/features/map/trackColors.ts';

const RAMP_BASE = 14;
const RAMP_STOPS = 10;
const RAMP_MAX_PASSES = 10;
const RAMP_SPORTS = [sportTrackColor.running, sportTrackColor.cycling];

const rampGradient = ({ rgb, alpha }: { rgb: [number, number, number]; alpha: number }) => {
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

interface RampSwatchProps {
  intensity: TrackIntensity;
}

export const RampSwatch: FC<RampSwatchProps> = (props) => (
  <span aria-hidden className="flex h-2 w-12 shrink-0 flex-col overflow-hidden rounded-full">
    {RAMP_SPORTS.map((rgb) => (
      <span
        key={rgb.join()}
        className="flex-1"
        style={{ background: rampGradient({ rgb, alpha: trackIntensityAlpha[props.intensity] }) }}
      />
    ))}
  </span>
);
