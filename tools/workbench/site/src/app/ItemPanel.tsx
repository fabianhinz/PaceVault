import { useState, type FC } from 'react';
import { Check, CircleCheck, type LucideIcon } from 'lucide-react';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvChip } from '@pacevault/ui/components/pvChip/PvChip.tsx';
import { PvTabs } from '@pacevault/ui/components/pvTabs/PvTabs.tsx';
import { PvTabsContent } from '@pacevault/ui/components/pvTabs/PvTabsContent.tsx';
import { PvTabsList } from '@pacevault/ui/components/pvTabs/PvTabsList.tsx';
import { PvTabsTrigger } from '@pacevault/ui/components/pvTabs/PvTabsTrigger.tsx';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { Status } from '@scripts/frontmatter.ts';
import type { BoardItem } from '@site/lib/board.ts';
import { LABEL_BY_BUCKET, SLOTS, LABEL_BY_SLOT, type Slot } from '@site/lib/vocabulary.ts';
import { StatusIcon } from './StatusIcon.tsx';
import { TypeIcon } from './TypeIcon.tsx';
import { MockupPane } from './MockupPane.tsx';
import { Panel } from './Panel.tsx';
import { PlanPane } from './PlanPane.tsx';
import { ReviewPane } from './ReviewPane.tsx';
import { TechPane } from './TechPane.tsx';
import { useWriteMutation } from '@site/app/hooks/useWriteMutation.ts';

const MISSING_TITLE_BY_SLOT: Record<Slot, string> = {
  mockup: 'No mockup yet',
  plan: 'No plan yet',
  tech: 'No tech.md yet',
  review: 'No review yet',
};

type StatusAction = { to: Status; label: string; icon: LucideIcon };

const statusAction = (item: BoardItem): StatusAction | undefined => {
  const status = item.frontmatter.status;
  if (status === 'in-review') return { to: 'done', label: 'Mark done', icon: Check };
  const questionsOpen = item.questions.some((question) => question.open);
  if (status === 'planned' && !questionsOpen)
    return { to: 'ready', label: 'Mark ready', icon: CircleCheck };
  return undefined;
};

interface ItemPanelProps {
  item: BoardItem;
  tab: Slot;
  onTabChange: (tab: Slot) => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onClose: () => void;
}

/**
 * A tab stays mounted once shown (hidden while inactive: Radix drops `hidden` under
 * `forceMount`), so an iframe keeps its page and the diagrams stay drawn.
 */
export const ItemPanel: FC<ItemPanelProps> = (props) => {
  const device = useDevice();
  const remove = useWriteMutation();
  const status = useWriteMutation();
  const [seen, setSeen] = useState<ReadonlySet<Slot>>(() => new Set([props.tab]));
  if (!seen.has(props.tab)) setSeen(new Set([...seen, props.tab]));
  const item = props.item;
  const action = statusAction(item);
  const wide = props.expanded && device.desktop;
  const reviewStage = wide && item.reviewDoc;
  const keep = (slot: Slot): true | undefined => {
    if (seen.has(slot)) return true;
    return undefined;
  };
  const footer = (
    <div className="flex items-center gap-2">
      <PvButton
        variant="danger"
        size="sm"
        title="Delete item (its folder, no trash; Undo in the write card)"
        loading={remove.isPending}
        onClick={() =>
          remove.mutate(
            { name: 'item.delete', fields: { item: item.folder } },
            { onSuccess: props.onClose },
          )
        }
      >
        Delete item
      </PvButton>
      {action !== undefined && (
        <PvButton
          size="sm"
          className="ml-auto"
          title={`Sets status: ${action.to}`}
          loading={status.isPending}
          onClick={() =>
            status.mutate({
              name: 'plan.setStatus',
              fields: { item: item.folder, expected: item.statusLine, to: action.to },
            })
          }
        >
          <action.icon className="size-4" />
          {action.label}
        </PvButton>
      )}
    </div>
  );
  return (
    <Panel
      title={item.frontmatter.title}
      icon={item.type !== undefined && <TypeIcon type={item.type} />}
      chip={
        <PvChip className="inline-flex shrink-0 items-center gap-1">
          <StatusIcon bucket={item.frontmatter.status} className="size-3 text-text-secondary" />
          {LABEL_BY_BUCKET[item.frontmatter.status]}
        </PvChip>
      }
      meta={item.areas.length > 0 ? item.areas.join(' · ') : undefined}
      footer={footer}
      expanded={props.expanded}
      onExpandedChange={props.onExpandedChange}
      onClose={props.onClose}
    >
      <PvTabs
        value={props.tab}
        onValueChange={(value) => {
          const slot = SLOTS.find((candidate) => candidate === value);
          if (slot !== undefined) props.onTabChange(slot);
        }}
        className="min-h-0 flex-1"
      >
        <PvTabsList aria-label="Sections" className="shrink-0">
          {SLOTS.map((slot) => (
            <PvTabsTrigger
              key={slot}
              value={slot}
              disabled={!item.present[slot]}
              title={item.present[slot] ? undefined : MISSING_TITLE_BY_SLOT[slot]}
            >
              {LABEL_BY_SLOT[slot]}
            </PvTabsTrigger>
          ))}
        </PvTabsList>
        <PvTabsContent
          value="mockup"
          forceMount={keep('mockup')}
          className="min-h-0 flex-1 flex-col data-[state=active]:flex data-[state=inactive]:hidden"
        >
          {item.present.mockup && <MockupPane item={item} />}
        </PvTabsContent>
        <PvTabsContent
          value="plan"
          forceMount={keep('plan')}
          className="min-h-0 flex-1 overflow-y-auto data-[state=inactive]:hidden"
        >
          <PlanPane item={item} />
        </PvTabsContent>
        <PvTabsContent
          value="tech"
          forceMount={keep('tech')}
          className="min-h-0 flex-1 overflow-y-auto data-[state=inactive]:hidden"
        >
          {item.present.tech && (
            <TechPane item={item} expanded={wide} active={props.tab === 'tech'} />
          )}
        </PvTabsContent>
        <PvTabsContent
          value="review"
          forceMount={keep('review')}
          className={cn(
            'min-h-0 flex-1 data-[state=inactive]:hidden',
            reviewStage && 'flex-col data-[state=active]:flex',
            !reviewStage && 'overflow-y-auto',
          )}
        >
          {item.present.review && <ReviewPane item={item} wide={wide} />}
        </PvTabsContent>
      </PvTabs>
    </Panel>
  );
};
