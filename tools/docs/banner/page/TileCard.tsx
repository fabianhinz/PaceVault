import type { FC } from 'react';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { SHOT_FILE_BY_TILE, type TileKey } from '../bannerContent.ts';
import { BANNER_COPY } from './bannerLocale.ts';
import { FitText } from './FitText.tsx';
import { Shot } from './Shot.tsx';

interface TileCardProps {
  tileKey: TileKey;
}

export const TileCard: FC<TileCardProps> = (props) => (
  <PvCard className="min-h-0 min-w-0 gap-2.5 p-3">
    <Shot file={SHOT_FILE_BY_TILE[props.tileKey]} fit="contain" className="flex-1 [&>img]:p-3.5" />
    <FitText className="px-1">
      <PvTypography variant="title" as="span">
        {BANNER_COPY.tiles[props.tileKey].title}
      </PvTypography>
      <PvTypography variant="caption" as="span">
        {BANNER_COPY.tiles[props.tileKey].subtitle}
      </PvTypography>
    </FitText>
  </PvCard>
);
