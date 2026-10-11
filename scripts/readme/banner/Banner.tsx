import { useLayoutEffect, useRef } from 'react';
import { BatteryFull, Plane, Signal, Wifi } from 'lucide-react';
import { Card } from '@/components/ui/Card.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { cn } from '@/lib/utils.ts';
import {
  BANNER_TEXT,
  BANNER_TILES,
  DEFAULT_BANNER_LOCALE,
  isBannerLocale,
  type BannerTile,
} from '../tiles.ts';

/** Banner text is the app's own type scale, enlarged so it stays readable at README width. */
const TEXT_ZOOM = 1.5;

/** The capture opens this page with `?locale=de|en`. */
const localeParam = new URLSearchParams(window.location.search).get('locale');
const locale = isBannerLocale(localeParam) ? localeParam : DEFAULT_BANNER_LOCALE;
const text = BANNER_TEXT[locale];

const shotUrl = (file: string) => `/scripts/readme/out/${locale}/${file}`;

/** Text that never wraps; flags itself with `data-overflow` when it does not fit. */
const FitText = (props: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    for (const line of el.children) {
      if (line.scrollWidth > line.clientWidth + 1) line.setAttribute('data-overflow', '');
    }
  });
  return (
    <div
      ref={ref}
      className={cn(
        'min-w-0 [&>*]:block [&>*]:overflow-hidden [&>*]:whitespace-nowrap',
        props.className,
      )}
      style={{ zoom: TEXT_ZOOM }}
    >
      {props.children}
    </div>
  );
};

const TileText = (props: { tile: BannerTile; className?: string }) => (
  <FitText className={cn('px-1', props.className)}>
    <Typography variant="title" as="span">
      {text.tiles[props.tile.key].title}
    </Typography>
    <Typography variant="caption" as="span">
      {text.tiles[props.tile.key].subtitle}
    </Typography>
  </FitText>
);

const DesktopTile = (props: { tile: BannerTile }) => (
  <Card className={cn('min-h-0 min-w-0 gap-2.5 p-3', props.tile.place === 'hero' && 'row-span-2')}>
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden rounded-[10px] bg-surface-sunken">
      {props.tile.shots.map((shot) => (
        <img
          key={shot.file}
          src={shotUrl(shot.file)}
          alt=""
          className="block min-h-0 w-full flex-1 basis-0 object-cover"
          style={{ objectPosition: shot.objectPosition, flexGrow: shot.grow ?? 1 }}
        />
      ))}
    </div>
    <TileText tile={props.tile} />
  </Card>
);

const StatusBar = (props: { mode: BannerTile['statusBar'] }) => (
  <div className="flex h-6 shrink-0 items-center justify-between bg-surface-base px-5 text-[11px] font-semibold text-text-primary">
    <span>9:41</span>
    <span className="flex items-center gap-1">
      {props.mode === 'airplane' && <Plane size={12} />}
      {props.mode === 'online' && (
        <>
          <Signal size={12} />
          <Wifi size={12} />
        </>
      )}
      <BatteryFull size={14} />
    </span>
  </div>
);

const PhoneTile = (props: { tile: BannerTile }) => (
  <Card className="min-h-0 min-w-0 items-center justify-center gap-3.5 px-3 py-3.5">
    <div className="flex aspect-[390/844] w-[232px] shrink-0 flex-col overflow-hidden rounded-[34px] border-[6px] border-gray-800 bg-black shadow-[0_8px_24px_rgb(0_0_0/0.4)]">
      <StatusBar mode={props.tile.statusBar} />
      {props.tile.shots.map((shot) => (
        <img
          key={shot.file}
          src={shotUrl(shot.file)}
          alt=""
          className="block min-h-0 w-full flex-1 object-cover"
          style={{ objectPosition: shot.objectPosition }}
        />
      ))}
    </div>
    <TileText tile={props.tile} className="w-full text-center" />
  </Card>
);

export const Banner = () => {
  const hero = BANNER_TILES.find((tile) => tile.place === 'hero');
  const grid = BANNER_TILES.filter((tile) => tile.place !== 'phone');
  const phones = BANNER_TILES.filter((tile) => tile.place === 'phone');

  return (
    <div
      id="banner"
      className="relative flex h-[900px] w-[1600px] flex-col gap-[22px] overflow-hidden bg-surface-sunken px-10 pt-7 pb-9 font-sans"
    >
      {hero && (
        <div
          aria-hidden
          className="absolute -inset-10 bg-cover bg-center opacity-35 blur-[28px] saturate-[1.2]"
          style={{ backgroundImage: `url(${shotUrl(hero.shots[0]?.file ?? '')})` }}
        />
      )}
      <div className="relative flex items-center gap-[18px]">
        <img src="/favicon.svg" alt="" className="size-16 shrink-0" />
        <FitText>
          <Typography variant="h1" as="span">
            PaceVault
          </Typography>
          <Typography variant="body1" color="textSecondary" as="span">
            {text.tagline}
          </Typography>
        </FitText>
      </div>
      <div className="relative grid min-h-0 flex-1 grid-cols-[1fr_272px_272px] gap-5">
        <div className="grid min-h-0 grid-cols-3 grid-rows-2 gap-[18px]">
          {grid.map((tile) => (
            <DesktopTile key={tile.key} tile={tile} />
          ))}
        </div>
        {phones.map((tile) => (
          <PhoneTile key={tile.key} tile={tile} />
        ))}
      </div>
    </div>
  );
};
