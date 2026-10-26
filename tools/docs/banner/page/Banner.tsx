import type { FC } from 'react';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { BACKDROP_FILE, FLOW_KEYS, TILE_KEYS } from '../bannerContent.ts';
import { BANNER_COPY, shotUrl } from './bannerLocale.ts';
import { FitText } from './FitText.tsx';
import { FlowCard } from './FlowCard.tsx';
import { TileCard } from './TileCard.tsx';

export const Banner: FC = () => (
  <div
    id="banner"
    className="relative flex h-1180px w-1600px flex-col gap-22px overflow-hidden bg-surface-sunken px-10 pt-7 pb-9 font-sans"
  >
    <div
      aria-hidden
      className="absolute -inset-10 bg-cover bg-center opacity-35 blur-28px saturate-[1.2]"
      style={{ backgroundImage: `url(${shotUrl(BACKDROP_FILE)})` }}
    />
    <div className="relative flex items-center gap-18px">
      <img src="/favicon.svg" alt="" className="size-16 shrink-0" />
      <FitText>
        <PvTypography variant="h1" as="span">
          PaceVault
        </PvTypography>
        <PvTypography variant="body1" color="textSecondary" as="span">
          {BANNER_COPY.tagline}
        </PvTypography>
      </FitText>
    </div>
    <div className="relative flex h-674px flex-none gap-10">
      {FLOW_KEYS.map((flowKey, index) => (
        <FlowCard key={flowKey} flowKey={flowKey} index={index} />
      ))}
    </div>
    <div className="relative grid h-320px flex-none grid-cols-5 gap-18px">
      {TILE_KEYS.map((tileKey) => (
        <TileCard key={tileKey} tileKey={tileKey} />
      ))}
    </div>
  </div>
);
