import { Trash2 } from 'lucide-react';
import { Button } from '@pacevault/ui/components/Button.tsx';
import { Checkbox } from '@pacevault/ui/components/Checkbox.tsx';
import { Typography } from '@pacevault/ui/components/Typography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { CheckItem } from '../../../scripts/frontmatter.ts';
import { Inline } from './Prose.tsx';
import { useWrite } from './useWrite.ts';

type CheckRowProps = {
  folder: string;
  check: CheckItem;
  /** `check`: a real-data check in plan.md; `agent`: an agent decision in review/decisions.md. */
  kind: 'check' | 'agent';
  /** false: no delete (the Accept section repeats the checks). */
  removable?: boolean;
};

/**
 * One real-data check or agent decision: tick box, text (an agent's reason muted), delete. A
 * superseded decision (`[~]`, R17) has no tick box: struck through and muted, with what replaced it.
 */
export const CheckRow = (props: CheckRowProps) => {
  const toggle = useWrite();
  const remove = useWrite();
  const check = props.check;
  const first = check.raw.split('\n')[0];
  const agent = props.kind === 'agent';
  let body = check.text;
  let pointer: string | undefined = undefined;
  const replaced = /\s*\bSuperseded by:\s*([\s\S]*)$/.exec(check.text);
  if (check.superseded && replaced) {
    body = check.text.slice(0, replaced.index);
    pointer = replaced[1];
  }
  const why = /\s(Agent:[\s\S]*)$/.exec(body);
  let what = body;
  if (agent && why) what = body.slice(0, why.index);
  let toggleName: 'plan.toggleCheck' | 'review.toggleDecision' = 'plan.toggleCheck';
  let removeName: 'plan.deleteCheck' | 'review.deleteDecision' = 'plan.deleteCheck';
  let removeLabel = 'Delete this real-data check';
  if (agent) {
    toggleName = 'review.toggleDecision';
    removeName = 'review.deleteDecision';
    removeLabel = 'Delete this agent decision';
  }
  let tickLabel = 'Tick';
  if (check.checked) tickLabel = 'Untick';
  return (
    <li className="flex items-start gap-2">
      {!check.superseded && (
        <Checkbox
          checked={check.checked}
          disabled={toggle.isPending}
          aria-label={tickLabel}
          className="mt-0.5"
          onCheckedChange={(checked) =>
            toggle.mutate({
              name: toggleName,
              fields: { item: props.folder, expected: first, checked: String(checked) },
            })
          }
        />
      )}
      <Typography
        as="span"
        className={cn(
          'min-w-0 flex-1',
          (check.checked || check.superseded) && 'text-text-tertiary',
        )}
      >
        <Inline markdown={what} className={cn(check.superseded && 'line-through')} />
        {agent && why && <Inline markdown={why[1]} className="block text-xs text-text-tertiary" />}
        {pointer !== undefined && (
          <Inline
            markdown={`Superseded by: ${pointer}`}
            className="block text-xs text-text-secondary"
          />
        )}
      </Typography>
      {props.removable !== false && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={removeLabel}
          title={removeLabel}
          loading={remove.isPending}
          className="-mt-1 hover:text-status-danger"
          onClick={() =>
            remove.mutate({ name: removeName, fields: { item: props.folder, expected: check.raw } })
          }
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </li>
  );
};
