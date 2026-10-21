import { useState } from 'react';
import { Check, CircleCheck, type LucideIcon } from 'lucide-react';
import { Button } from '@pacevault/ui/components/Button.tsx';
import { Chip } from '@pacevault/ui/components/Chip.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@pacevault/ui/components/Tabs.tsx';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { Status } from '../../../scripts/frontmatter.ts';
import type { BoardItem } from '../lib/board.ts';
import { LABELS, SLOTS, SLOT_LABEL, type Slot } from '../lib/vocabulary.ts';
import { StatusIcon, TypeIcon } from './icons.tsx';
import { MockupPane } from './MockupPane.tsx';
import { Panel } from './Panel.tsx';
import { PlanPane } from './PlanPane.tsx';
import { ReviewPane } from './ReviewPane.tsx';
import { TechPane } from './TechPane.tsx';
import { useWrite } from './useWrite.ts';

const SLOT_MISSING: Record<Slot, string> = {
  mockup: 'No mockup yet',
  plan: 'No plan yet',
  tech: 'No tech.md yet',
  review: 'No review yet',
};

type StatusAction = { to: Status; label: string; icon: LucideIcon };

/** The owner gates (Q14): Mark ready on a planned item without open questions, Mark done in review. */
const statusAction = (item: BoardItem): StatusAction | undefined => {
  const status = item.data.status;
  if (status === 'in-review') return { to: 'done', label: 'Mark done', icon: Check };
  const open = item.questions.some((question) => question.open);
  if (status === 'planned' && !open) return { to: 'ready', label: 'Mark ready', icon: CircleCheck };
  return undefined;
};

type ItemPanelProps = {
  item: BoardItem;
  tab: Slot;
  onTabChange: (tab: Slot) => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onClose: () => void;
};

/**
 * One item in the panel: type icon, title, status chip and areas; tabs Mockup · Plan · Tech ·
 * Review (a missing one disabled); footer with Delete item left and the status action right.
 * A tab stays mounted once shown (hidden while inactive: Radix drops `hidden` under
 * `forceMount`), so an iframe keeps its page and the diagrams stay drawn.
 */
export const ItemPanel = (props: ItemPanelProps) => {
  const device = useDevice();
  const remove = useWrite();
  const status = useWrite();
  // tabs shown once stay mounted; a new tab joins during render (derived state)
  const [seen, setSeen] = useState<ReadonlySet<Slot>>(() => new Set([props.tab]));
  if (!seen.has(props.tab)) setSeen(new Set([...seen, props.tab]));
  const item = props.item;
  const action = statusAction(item);
  const wide = props.expanded && device.isDesktop;
  // the review doc beside its sections fills the body; without a doc the column scrolls (Q18)
  const reviewStage = wide && item.reviewDoc;
  const keep = (slot: Slot): true | undefined => {
    if (seen.has(slot)) return true;
    return undefined;
  };
  const footer = (
    <div className="flex items-center gap-2">
      <Button
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
      </Button>
      {action !== undefined && (
        <Button
          size="sm"
          className="ml-auto"
          title={`Sets status: ${action.to}`}
          loading={status.isPending}
          onClick={() =>
            status.mutate({
              name: 'plan.setStatus',
              fields: { item: item.folder, expected: item.lines.status, to: action.to },
            })
          }
        >
          <action.icon className="size-4" />
          {action.label}
        </Button>
      )}
    </div>
  );
  return (
    <Panel
      title={item.data.title}
      icon={item.type !== undefined && <TypeIcon type={item.type} />}
      chip={
        <Chip className="inline-flex shrink-0 items-center gap-1">
          <StatusIcon bucket={item.data.status} className="size-3 text-text-secondary" />
          {LABELS[item.data.status]}
        </Chip>
      }
      meta={item.areas.length > 0 ? item.areas.join(' · ') : undefined}
      footer={footer}
      expanded={props.expanded}
      onExpandedChange={props.onExpandedChange}
      onClose={props.onClose}
    >
      <Tabs
        value={props.tab}
        onValueChange={(value) => {
          const slot = SLOTS.find((candidate) => candidate === value);
          if (slot !== undefined) props.onTabChange(slot);
        }}
        className="min-h-0 flex-1"
      >
        <TabsList aria-label="Sections" className="shrink-0">
          {SLOTS.map((slot) => (
            <TabsTrigger
              key={slot}
              value={slot}
              disabled={!item.has[slot]}
              title={item.has[slot] ? undefined : SLOT_MISSING[slot]}
            >
              {SLOT_LABEL[slot]}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent
          value="mockup"
          forceMount={keep('mockup')}
          className="min-h-0 flex-1 flex-col data-[state=active]:flex data-[state=inactive]:hidden"
        >
          {item.has.mockup && <MockupPane item={item} />}
        </TabsContent>
        <TabsContent
          value="plan"
          forceMount={keep('plan')}
          className="min-h-0 flex-1 overflow-y-auto data-[state=inactive]:hidden"
        >
          <PlanPane item={item} />
        </TabsContent>
        <TabsContent
          value="tech"
          forceMount={keep('tech')}
          className="min-h-0 flex-1 overflow-y-auto data-[state=inactive]:hidden"
        >
          {item.has.tech && <TechPane item={item} expanded={wide} active={props.tab === 'tech'} />}
        </TabsContent>
        <TabsContent
          value="review"
          forceMount={keep('review')}
          className={cn(
            'min-h-0 flex-1 data-[state=inactive]:hidden',
            reviewStage && 'flex-col data-[state=active]:flex',
            !reviewStage && 'overflow-y-auto',
          )}
        >
          {item.has.review && <ReviewPane item={item} wide={wide} />}
        </TabsContent>
      </Tabs>
    </Panel>
  );
};
