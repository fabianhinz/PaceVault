import type { FC } from 'react';
import { PvChip } from '@pacevault/ui/components/pvChip/PvChip.tsx';
import { PvList } from '@pacevault/ui/components/pvList/PvList.tsx';
import { PvListItem } from '@pacevault/ui/components/pvList/PvListItem.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import type { NeedsYouEntry } from '@site/lib/board.ts';
import { REASONS, LABEL_BY_REASON, SLOT_BY_REASON, type Slot } from '@site/lib/vocabulary.ts';
import type { Item } from '@site/lib/writeBack.ts';
import { FlakyRow } from './FlakyRow.tsx';

const FLAKY_TITLE =
  'tools/workbench/backlog/flaky.md: a failing test listed here is re-run with --workers 1. Fix it or remove the entry.';

interface NeedsYouProps {
  needs: NeedsYouEntry[];
  flaky: Item[];
  onOpen: (target: { folder: string; tab: Slot }) => void;
}

export const NeedsYou: FC<NeedsYouProps> = (props) => {
  if (props.needs.length === 0 && props.flaky.length === 0) {
    return (
      <PvTypography variant="caption" color="textTertiary" as="p" className="p-1">
        Nothing waits on you.
      </PvTypography>
    );
  }
  return (
    <PvList>
      {REASONS.map((reason) => {
        const entries = props.needs.filter((entry) => entry.reason === reason);
        if (entries.length === 0) return null;
        return [
          <li key={reason} className="px-1 pt-1">
            <PvTypography variant="overline">{LABEL_BY_REASON[reason]}</PvTypography>
          </li>,
          ...entries.map((entry) => (
            <PvListItem
              key={`${reason}-${entry.folder}`}
              primary={entry.title}
              onClick={() => props.onOpen({ folder: entry.folder, tab: SLOT_BY_REASON[reason] })}
            >
              <PvChip>{entry.count}</PvChip>
            </PvListItem>
          )),
        ];
      })}
      {props.flaky.length > 0 && (
        <li className="px-1 pt-1" title={FLAKY_TITLE}>
          <PvTypography variant="overline">Flaky tests</PvTypography>
        </li>
      )}
      {props.flaky.map((item) => (
        <FlakyRow key={item.raw} item={item} />
      ))}
    </PvList>
  );
};
