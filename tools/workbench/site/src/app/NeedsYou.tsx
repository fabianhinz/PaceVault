import { Trash2 } from 'lucide-react';
import { Button } from '@pacevault/ui/components/Button.tsx';
import { Chip } from '@pacevault/ui/components/Chip.tsx';
import { List, ListItem } from '@pacevault/ui/components/List.tsx';
import { Typography } from '@pacevault/ui/components/Typography.tsx';
import type { NeedsYouEntry } from '../lib/board.ts';
import { REASONS, REASON_LABEL, REASON_TAB, type Slot } from '../lib/vocabulary.ts';
import type { Item } from '../lib/writeBack.ts';
import { Inline } from './Prose.tsx';
import { useWrite } from './useWrite.ts';

type NeedsYouProps = {
  needs: NeedsYouEntry[];
  flaky: Item[];
  onOpen: (folder: string, tab: Slot) => void;
};

const FLAKY_TITLE =
  'tools/workbench/backlog/flaky.md: a failing test listed here is re-run with --workers 1. Fix it or remove the entry.';

const FlakyRow = (props: { item: Item }) => {
  const write = useWrite();
  return (
    <li className="flex items-start gap-2 px-1">
      <Typography as="span" className="min-w-0 flex-1 pt-1">
        <Inline markdown={props.item.first.replace(/^- /, '')} />
      </Typography>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Delete this entry from flaky.md"
        title="Delete this entry from flaky.md"
        loading={write.isPending}
        onClick={() => write.mutate({ name: 'flaky.remove', fields: { expected: props.item.raw } })}
        className="hover:text-status-danger"
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
};

/**
 * What waits on the owner, one group per reason (open questions, agent decisions, open
 * findings); an entry opens the item on the tab of its reason. Below, the flaky tests while
 * `flaky.md` has entries.
 */
export const NeedsYou = (props: NeedsYouProps) => {
  if (props.needs.length === 0 && props.flaky.length === 0) {
    return (
      <Typography variant="caption" color="textTertiary" as="p" className="p-1">
        Nothing waits on you.
      </Typography>
    );
  }
  return (
    <List>
      {REASONS.map((reason) => {
        const entries = props.needs.filter((entry) => entry.reason === reason);
        if (entries.length === 0) return null;
        return [
          <li key={reason} className="px-1 pt-1">
            <Typography variant="overline">{REASON_LABEL[reason]}</Typography>
          </li>,
          ...entries.map((entry) => (
            <ListItem
              key={`${reason}-${entry.folder}`}
              primary={entry.title}
              onClick={() => props.onOpen(entry.folder, REASON_TAB[reason])}
            >
              <Chip>{entry.count}</Chip>
            </ListItem>
          )),
        ];
      })}
      {props.flaky.length > 0 && (
        <li className="px-1 pt-1" title={FLAKY_TITLE}>
          <Typography variant="overline">Flaky tests</Typography>
        </li>
      )}
      {props.flaky.map((item) => (
        <FlakyRow key={item.raw} item={item} />
      ))}
    </List>
  );
};
