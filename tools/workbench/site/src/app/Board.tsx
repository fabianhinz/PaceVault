import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CircleAlert, Info } from 'lucide-react';
import { overwriteGetLocale } from '@pacevault/i18n/runtime.js';
import { Banner } from '@pacevault/ui/components/Banner.tsx';
import { Button } from '@pacevault/ui/components/Button.tsx';
import type { BoardItem } from '../lib/board.ts';
import { SLOTS, type Slot } from '../lib/vocabulary.ts';
import { Columns } from './Columns.tsx';
import { ItemPanel } from './ItemPanel.tsx';
import { Panel } from './Panel.tsx';
import { Prose } from './Prose.tsx';
import { useBoard } from './useBoard.ts';
import { useBoardChangedEffect } from './useBoardChangedEffect.ts';
import { messageOf } from './useWrite.ts';
import { WriteCard } from './WriteCard.tsx';

// The board's own text is English; the kit's few Paraglide strings follow (Q15).
overwriteGetLocale(() => 'en');

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
});

const GUIDE_TITLE = 'How to work with the backlog';

/** What the panel shows: one item on a tab, or the guide; one at a time. */
type Open = { kind: 'item'; folder: string; tab: Slot } | { kind: 'guide' } | undefined;

/** The tab an item opens on: the asked one when it exists, else the first that exists. */
const tabFor = (item: BoardItem, asked: Slot | undefined): Slot => {
  if (asked !== undefined && item.has[asked]) return asked;
  const first = SLOTS.find((slot) => item.has[slot]);
  if (first === undefined) return 'plan';
  return first;
};

const BoardPage = () => {
  useBoardChangedEffect();
  const board = useBoard();
  const [open, setOpen] = useState<Open>(undefined);
  const [expanded, setExpanded] = useState(false);
  const data = board.data;

  /** A tab switch never changes the width: only Expand/Collapse does (owner). */
  const showTab = (folder: string, tab: Slot) => setOpen({ kind: 'item', folder, tab });
  /** Another item (or the same one after the guide or Close) opens collapsed. */
  const openItem = (folder: string, asked: Slot | undefined) => {
    const item = data?.items.find((candidate) => candidate.folder === folder);
    if (item === undefined) return;
    if (open?.kind !== 'item' || open.folder !== folder) setExpanded(false);
    showTab(folder, tabFor(item, asked));
  };
  const toggleGuide = () => {
    if (open?.kind === 'guide') {
      setOpen(undefined);
      return;
    }
    setOpen({ kind: 'guide' });
    setExpanded(false);
  };
  const close = () => setOpen(undefined);

  let item: BoardItem | undefined = undefined;
  if (open?.kind === 'item') item = data?.items.find((entry) => entry.folder === open.folder);
  const panelShown = open?.kind === 'guide' || item !== undefined;

  return (
    <div className="flex h-dvh flex-col">
      {data !== undefined && data.errors.length > 0 && (
        <Banner variant="error" icon={CircleAlert} role="alert" className="m-4 mb-0 h-auto">
          <strong className="block font-medium">
            workbench:check fails: a plan named here is missing from the board or shown in an older
            state until it is fixed.
          </strong>
          {data.errors.map((error) => (
            <span key={error} className="block">
              {error}
            </span>
          ))}
        </Banner>
      )}
      {board.isError && (
        <Banner variant="error" icon={CircleAlert} role="alert" className="mx-4 mt-4 h-auto">
          board.read failed: {messageOf(board.error)}
        </Banner>
      )}
      {data !== undefined && (
        <Columns
          board={data}
          spacer={panelShown && !expanded}
          onOpen={openItem}
          guide={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Guide"
              title={`${GUIDE_TITLE} (tools/workbench/GUIDE.md)`}
              aria-pressed={open?.kind === 'guide'}
              onClick={toggleGuide}
              className="-my-1.5 ml-auto"
            >
              <Info className="size-4" />
            </Button>
          }
        />
      )}
      {item !== undefined && open?.kind === 'item' && (
        <ItemPanel
          key={item.folder}
          item={item}
          tab={tabFor(item, open.tab)}
          onTabChange={(tab) => showTab(item.folder, tab)}
          expanded={expanded}
          onExpandedChange={setExpanded}
          onClose={close}
        />
      )}
      {open?.kind === 'guide' && data !== undefined && (
        <Panel
          title={GUIDE_TITLE}
          expanded={expanded}
          onExpandedChange={setExpanded}
          onClose={close}
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Prose html={data.guideHtml} className="mx-auto max-w-3xl" />
          </div>
        </Panel>
      )}
      <WriteCard />
    </div>
  );
};

/** The board island (`client:only="react"`): one query client, the page, the panel, the write card. */
export const Board = () => (
  <QueryClientProvider client={queryClient}>
    <BoardPage />
  </QueryClientProvider>
);
