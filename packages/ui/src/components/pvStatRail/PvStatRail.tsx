import type { FC, ReactNode } from 'react';
import { PvTypography } from '../pvTypography/PvTypography.tsx';
import { PvStatRailContent } from './PvStatRailContent.tsx';
import type { StatRailNote, StatRailRow } from './types.ts';

type StatRailNotePlacement = 'top' | 'bottom';

interface PvStatRailProps {
  header: string;
  rows: StatRailRow[];
  active: boolean;
  noteSlot?: boolean;
  secondarySlot?: boolean;
  note?: StatRailNote;
  notePlacement?: StatRailNotePlacement;
}

const noteContent = (note: StatRailNote | undefined): ReactNode => {
  if (note === undefined) return null;
  return (
    <div className="flex min-w-0 items-start gap-1">
      {note.icon !== undefined && (
        <span className="mt-0.5 shrink-0" style={{ color: note.color }}>
          {note.icon}
        </span>
      )}
      <PvTypography
        variant="caption"
        as="p"
        data-testid="stat-rail-note"
        className="line-clamp-2 min-w-0 leading-4 break-words"
        style={{ color: note.color }}
      >
        {note.text}
      </PvTypography>
    </div>
  );
};

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
  const placement = props.notePlacement ?? 'bottom';
  return (
    <div
      data-testid="stat-rail"
      className="grid h-full grid-rows-[2rem_minmax(0,1fr)_2rem] overflow-hidden border-r border-white/10 pr-2"
    >
      {placement === 'top' ? (
        <div className="flex min-w-0 flex-col justify-end">{noteContent(props.note)}</div>
      ) : (
        <div aria-hidden />
      )}
      <div className="flex min-h-0 flex-col justify-center">
        <PvStatRailContent
          header={props.header}
          rows={props.rows}
          active={props.active}
          secondarySlot={props.secondarySlot}
        />
      </div>
      {placement === 'bottom' ? (
        <div className="min-w-0">{noteContent(props.note)}</div>
      ) : (
        <div aria-hidden />
      )}
    </div>
  );
};
