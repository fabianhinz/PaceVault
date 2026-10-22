import { Fragment, useLayoutEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Card } from '@pacevault/ui/components/Card.tsx';
import { Typography } from '@pacevault/ui/components/Typography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import {
  BANNER_FLOWS,
  BANNER_TEXT,
  BANNER_TILES,
  DEFAULT_BANNER_LOCALE,
  isBannerLocale,
  type BannerFlow,
  type BannerFrame,
  type BannerTile,
} from '../tiles.ts';

const TEXT_ZOOM = 1.5;

const localeParam = new URLSearchParams(window.location.search).get('locale');
const locale = isBannerLocale(localeParam) ? localeParam : DEFAULT_BANNER_LOCALE;
const text = BANNER_TEXT[locale];

const shotUrl = (file: string) => `/banner/out/${locale}/${file}`;

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

const Shot = (props: { file: string; fit: 'cover' | 'contain'; className?: string }) => (
  <div
    className={cn(
      'min-h-0 min-w-0 overflow-hidden rounded-[10px] bg-surface-sunken',
      props.className,
    )}
  >
    <img
      src={shotUrl(props.file)}
      alt=""
      className={cn(
        'block size-full',
        props.fit === 'cover' && 'object-cover object-top',
        props.fit === 'contain' && 'object-contain object-center',
      )}
    />
  </div>
);

const StepCaption = (props: { step: number; label: string }) => (
  <div className="flex h-9 items-center gap-2.5">
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-text-primary text-lg font-bold text-surface-base">
      {props.step}
    </span>
    <FitText className="flex-1">
      <Typography variant="title" as="span">
        {props.label}
      </Typography>
    </FitText>
  </div>
);

const FrameShots = (props: { frame: BannerFrame }) => {
  if (props.frame.below === undefined) {
    return <Shot file={props.frame.file} fit="cover" className="h-[556px]" />;
  }
  return (
    <div className="flex h-[556px] flex-col gap-2">
      <Shot file={props.frame.file} fit="cover" className="h-[398px]" />
      <Shot file={props.frame.below} fit="contain" className="h-[150px]" />
    </div>
  );
};

const FlowCard = (props: { flow: BannerFlow; index: number }) => {
  const flowText = text.flows[props.flow.key];
  const fill = props.index === 0;
  return (
    <Card className={cn('min-w-0 gap-3 p-3', fill && 'flex-1', !fill && 'flex-none')}>
      <FitText className="px-1">
        <Typography variant="title" as="span">
          {flowText.title}
        </Typography>
      </FitText>
      <div className="flex">
        {props.flow.frames.map((frame, frameIndex) => (
          <Fragment key={frame.file}>
            {frameIndex > 0 && (
              <div className="flex h-[556px] w-12 flex-none items-center justify-center text-text-tertiary">
                <ArrowRight size={28} />
              </div>
            )}
            <div
              className={cn(
                'flex flex-col gap-2.5',
                fill && 'min-w-0 flex-1',
                !fill && 'w-[246px] flex-none',
              )}
            >
              <FrameShots frame={frame} />
              <StepCaption step={frameIndex + 1} label={flowText.steps[frameIndex] ?? ''} />
            </div>
          </Fragment>
        ))}
      </div>
    </Card>
  );
};

const Tile = (props: { tile: BannerTile }) => (
  <Card className="min-h-0 min-w-0 gap-2.5 p-3">
    <Shot file={props.tile.file} fit="contain" className="flex-1 [&>img]:p-3.5" />
    <FitText className="px-1">
      <Typography variant="title" as="span">
        {text.tiles[props.tile.key].title}
      </Typography>
      <Typography variant="caption" as="span">
        {text.tiles[props.tile.key].subtitle}
      </Typography>
    </FitText>
  </Card>
);

export const Banner = () => {
  const backdrop = BANNER_FLOWS[0]?.frames[1]?.file;

  return (
    <div
      id="banner"
      className="relative flex h-[1180px] w-[1600px] flex-col gap-[22px] overflow-hidden bg-surface-sunken px-10 pt-7 pb-9 font-sans"
    >
      {backdrop && (
        <div
          aria-hidden
          className="absolute -inset-10 bg-cover bg-center opacity-35 blur-[28px] saturate-[1.2]"
          style={{ backgroundImage: `url(${shotUrl(backdrop)})` }}
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
      <div className="relative flex h-[674px] flex-none gap-10">
        {BANNER_FLOWS.map((flow, index) => (
          <FlowCard key={flow.key} flow={flow} index={index} />
        ))}
      </div>
      <div className="relative grid h-[320px] flex-none grid-cols-5 gap-[18px]">
        {BANNER_TILES.map((tile) => (
          <Tile key={tile.key} tile={tile} />
        ))}
      </div>
    </div>
  );
};
