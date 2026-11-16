import type { FC } from 'react';
import type { TrackIntensity } from '@/store/mapPreferences.ts';
import { MAP_STYLE } from '@/components/mapBackground/mapStyle.ts';
import {
  rgbChannels,
  TRACK_BLEND,
  TRACK_COLOR_BY_SPORT,
  ALPHA_BY_TRACK_INTENSITY,
} from '@/components/mapBackground/trackColors.ts';

const RAMP_STOPS = 10;
const RAMP_MAX_PASSES = 10;
const CHANNEL_MAX = 255;
const RAMP_SPORTS = [TRACK_COLOR_BY_SPORT.running, TRACK_COLOR_BY_SPORT.cycling];

/** The basemap's background colour, the ground every track pass blends onto. */
const basemapChannels = (): [number, number, number] => {
  const background = MAP_STYLE.layers.find((layer) => layer.type === 'background');
  const color = background?.paint?.['background-color'];
  return rgbChannels(typeof color === 'string' ? color : 'black');
};

const BASEMAP_CHANNELS = basemapChannels();

/** One channel after `passes` overlapping tracks, the way the map blends them. */
const rampChannel = ({
  channel,
  base,
  alpha,
  passes,
}: {
  channel: number;
  base: number;
  alpha: number;
  passes: number;
}): number => {
  const share = alpha / CHANNEL_MAX;
  switch (TRACK_BLEND) {
    case 'additive':
      return Math.min(CHANNEL_MAX, base + passes * channel * share);
    case 'alpha': {
      const coverage = 1 - (1 - share) ** passes;
      return base + coverage * (channel - base);
    }
  }
};

const rampGradient = ({ rgb, alpha }: { rgb: [number, number, number]; alpha: number }) => {
  const stops: string[] = [];
  for (let index = 0; index < RAMP_STOPS; index++) {
    const share = index / (RAMP_STOPS - 1);
    const passes = 1 + (RAMP_MAX_PASSES - 1) * share;
    const channels = rgb.map((channel, channelIndex) =>
      Math.round(
        rampChannel({ channel, base: BASEMAP_CHANNELS[channelIndex] ?? 0, alpha, passes }),
      ),
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
        style={{
          background: rampGradient({ rgb, alpha: ALPHA_BY_TRACK_INTENSITY[props.intensity] }),
        }}
      />
    ))}
  </span>
);
