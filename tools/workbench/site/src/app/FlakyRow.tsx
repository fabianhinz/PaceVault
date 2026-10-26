import type { FC } from 'react';
import { Trash2 } from 'lucide-react';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import type { Item } from '@site/lib/writeBack.ts';
import { Inline } from './Inline.tsx';
import { useWriteMutation } from '@site/app/hooks/useWriteMutation.ts';

interface FlakyRowProps {
  item: Item;
}

export const FlakyRow: FC<FlakyRowProps> = (props) => {
  const write = useWriteMutation();
  return (
    <li className="flex items-start gap-2 px-1">
      <PvTypography as="span" className="min-w-0 flex-1 pt-1">
        <Inline markdown={props.item.first.replace(/^- /, '')} />
      </PvTypography>
      <PvButton
        variant="ghost"
        size="icon"
        aria-label="Delete this entry from flaky.md"
        title="Delete this entry from flaky.md"
        loading={write.isPending}
        onClick={() => write.mutate({ name: 'flaky.remove', fields: { expected: props.item.raw } })}
        className="hover:text-status-danger"
      >
        <Trash2 className="size-4" />
      </PvButton>
    </li>
  );
};
