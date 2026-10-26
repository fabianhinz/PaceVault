import type { CSSProperties, FC, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn.ts';
import { TILE_CLASS } from '../../lib/surfaces.ts';
import type { TokenColor } from '../../lib/tokens.ts';
import { PvTypography } from '../pvTypography/PvTypography.tsx';
import { PvStatTileReading } from './PvStatTileReading.tsx';
import type { StatTileReading } from './types.ts';

type StatTileAction = { info?: ReactNode; onClick?: never } | { onClick: () => void; info?: never };

type PvStatTileProps = StatTileReading &
  StatTileAction & {
    title: string;
    stat?: string;
    icon?: { icon: LucideIcon; color: TokenColor };
    secondary?: StatTileReading;
    note?: ReactNode;
    style?: CSSProperties;
    children?: ReactNode;
  };

export const PvStatTile: FC<PvStatTileProps> = (props) => {
  const chartPresent = props.children !== undefined;
  const Root = props.onClick === undefined ? 'div' : 'button';
  const TitleIcon = props.icon?.icon;
  return (
    <Root
      type={props.onClick === undefined ? undefined : 'button'}
      onClick={props.onClick}
      data-stat={props.stat}
      style={props.style}
      className={cn(
        TILE_CLASS,
        'grid min-w-0 grid-cols-[minmax(0,1fr)_auto] grid-rows-[16px_28px_32px] gap-y-1 p-2',
        props.onClick !== undefined && 'cursor-pointer text-left hover:bg-white/10',
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        {TitleIcon !== undefined && (
          <TitleIcon size={12} aria-hidden className="shrink-0" color={props.icon?.color} />
        )}
        <PvTypography variant="overline" noWrap>
          {props.title}
        </PvTypography>
      </div>
      {props.info}
      <div className="col-span-2 col-start-1 row-start-2 flex min-w-0 items-baseline gap-1">
        <PvStatTileReading value={props.value} unit={props.unit} />
        {props.secondary !== undefined && (
          <PvStatTileReading value={props.secondary.value} unit={props.secondary.unit} />
        )}
        {chartPresent && props.secondary === undefined && props.note !== undefined && (
          <PvTypography
            variant="caption"
            color="textTertiary"
            tabularNums
            noWrap
            zeroMinWidth
            className="flex-1"
          >
            {props.note}
          </PvTypography>
        )}
      </div>
      {chartPresent && (
        <div className="col-span-2 row-start-3 flex min-w-0 items-center">{props.children}</div>
      )}
      {!chartPresent && props.note !== undefined && (
        <PvTypography
          variant="caption"
          as="p"
          color="textTertiary"
          tabularNums
          className="col-span-2 row-start-3 line-clamp-2"
        >
          {props.note}
        </PvTypography>
      )}
    </Root>
  );
};
