import type { FC } from 'react';
import { Trash2 } from 'lucide-react';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvCheckbox } from '@pacevault/ui/components/pvCheckbox/PvCheckbox.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { CheckItem } from '@scripts/frontmatter.ts';
import { checkRowText } from '@site/lib/checkText.ts';
import { Inline } from './Inline.tsx';
import { useWriteMutation } from '@site/app/hooks/useWriteMutation.ts';

interface CheckRowProps {
  folder: string;
  check: CheckItem;
  kind: 'check' | 'agent';
  removable?: boolean;
}

const WRITES_BY_CHECK_KIND: Record<
  CheckRowProps['kind'],
  {
    toggle: 'plan.toggleCheck' | 'review.toggleDecision';
    remove: 'plan.deleteCheck' | 'review.deleteDecision';
    removeLabel: string;
  }
> = {
  check: {
    toggle: 'plan.toggleCheck',
    remove: 'plan.deleteCheck',
    removeLabel: 'Delete this real-data check',
  },
  agent: {
    toggle: 'review.toggleDecision',
    remove: 'review.deleteDecision',
    removeLabel: 'Delete this agent decision',
  },
};

export const CheckRow: FC<CheckRowProps> = (props) => {
  const toggle = useWriteMutation();
  const remove = useWriteMutation();
  const check = props.check;
  const first = check.raw.split('\n')[0];
  const agent = props.kind === 'agent';
  const checkText = checkRowText({ text: check.text, superseded: check.superseded, agent });
  const writes = WRITES_BY_CHECK_KIND[props.kind];
  let tickLabel = 'Tick';
  if (check.checked) tickLabel = 'Untick';
  return (
    <li className="flex items-start gap-2">
      {!check.superseded && (
        <PvCheckbox
          checked={check.checked}
          disabled={toggle.isPending}
          aria-label={tickLabel}
          className="mt-0.5"
          onCheckedChange={(checked) =>
            toggle.mutate({
              name: writes.toggle,
              fields: { item: props.folder, expected: first, checked: String(checked) },
            })
          }
        />
      )}
      <PvTypography
        as="span"
        className={cn(
          'min-w-0 flex-1',
          (check.checked || check.superseded) && 'text-text-tertiary',
        )}
      >
        <Inline markdown={checkText.what} className={cn(check.superseded && 'line-through')} />
        {checkText.why !== undefined && (
          <Inline markdown={checkText.why} className="block text-xs text-text-tertiary" />
        )}
        {checkText.pointer !== undefined && (
          <Inline
            markdown={`Superseded by: ${checkText.pointer}`}
            className="block text-xs text-text-secondary"
          />
        )}
      </PvTypography>
      {props.removable !== false && (
        <PvButton
          variant="ghost"
          size="icon"
          aria-label={writes.removeLabel}
          title={writes.removeLabel}
          loading={remove.isPending}
          className="-mt-1 hover:text-status-danger"
          onClick={() =>
            remove.mutate({
              name: writes.remove,
              fields: { item: props.folder, expected: check.raw },
            })
          }
        >
          <Trash2 className="size-4" />
        </PvButton>
      )}
    </li>
  );
};
