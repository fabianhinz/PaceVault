import type { FC } from 'react';
import { PvTypography } from '../pvTypography/PvTypography.tsx';
import { PvStatRailContent } from './PvStatRailContent.tsx';
import type { StatRailNote, StatRailRow } from './types.ts';

interface PvStatRailProps {
  header: string;
  rows: StatRailRow[];
  active: boolean;
  noteSlot?: boolean;
  secondarySlot?: boolean;
  note?: StatRailNote;
}

export const PvStatRail: FC<PvStatRailProps> = (props) => {
  if (!props.noteSlot) {
    return (
      <div
        data-testid="stat-rail"
        className="flex h-full flex-col justify-center overflow-hidden border-r border-white/10 pr-2"
      >
        <PvStatRailContent
          header={props.header}
          rows={props.rows}
          active={props.active}
          secondarySlot={props.secondarySlot}
        />
      </div>
    );
  }
  return (
    <div
      data-testid="stat-rail"
      className="grid h-full grid-rows-[2rem_minmax(0,1fr)_2rem] overflow-hidden border-r border-white/10 pr-2"
    >
      <div aria-hidden />
      <div className="flex min-h-0 flex-col justify-center">
        <PvStatRailContent
          header={props.header}
          rows={props.rows}
          active={props.active}
          secondarySlot={props.secondarySlot}
        />
      </div>
      <div className="min-w-0">
        {props.note && (
          <PvTypography
            variant="caption"
            as="p"
            data-testid="stat-rail-note"
            className="line-clamp-2 leading-4 break-words"
            style={{ color: props.note.color }}
          >
            {props.note.text}
          </PvTypography>
        )}
      </div>
    </div>
  );
};
