import type { FC } from 'react';
import { CircleAlert, Info } from 'lucide-react';
import { PvBanner } from '@pacevault/ui/components/pvBanner/PvBanner.tsx';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import type { BoardItem } from '@site/lib/board.ts';
import { Columns } from './Columns.tsx';
import { ItemPanel } from './ItemPanel.tsx';
import { Panel } from './Panel.tsx';
import { Prose } from './Prose.tsx';
import { useBoard } from '@site/app/hooks/useBoard.ts';
import { useBoardChangedEffect } from '@site/app/hooks/useBoardChangedEffect.ts';
import { tabFor, usePanelState } from '@site/app/hooks/usePanelState.ts';
import { messageOf } from './writeErrors.ts';
import { WriteCard } from './WriteCard.tsx';

const GUIDE_TITLE = 'How to work with the backlog';

export const BoardPage: FC = () => {
  useBoardChangedEffect();
  const board = useBoard();
  const boardView = board.data;
  const panelState = usePanelState({ items: boardView?.items });

  let item: BoardItem | undefined = undefined;
  if (panelState.panel?.kind === 'item') {
    const folder = panelState.panel.folder;
    item = boardView?.items.find((entry) => entry.folder === folder);
  }
  const panelShown = panelState.panel?.kind === 'guide' || item !== undefined;

  return (
    <div className="flex h-dvh flex-col">
      {boardView !== undefined && boardView.errors.length > 0 && (
        <PvBanner variant="error" icon={CircleAlert} role="alert" className="m-4 mb-0 h-auto">
          <strong className="block font-medium">
            workbench:check fails: a plan named here is missing from the board or shown in an older
            state until it is fixed.
          </strong>
          {boardView.errors.map((error) => (
            <span key={error} className="block">
              {error}
            </span>
          ))}
        </PvBanner>
      )}
      {board.isError && (
        <PvBanner variant="error" icon={CircleAlert} role="alert" className="mx-4 mt-4 h-auto">
          board.read failed: {messageOf(board.error)}
        </PvBanner>
      )}
      {boardView !== undefined && (
        <Columns
          board={boardView}
          spacer={panelShown && !panelState.expanded}
          onOpen={(target) => panelState.openItem({ folder: target.folder, asked: target.tab })}
          guide={
            <PvButton
              variant="ghost"
              size="icon"
              aria-label="Guide"
              title={`${GUIDE_TITLE} (tools/workbench/GUIDE.md)`}
              aria-pressed={panelState.panel?.kind === 'guide'}
              onClick={panelState.toggleGuide}
              className="-my-1.5 ml-auto"
            >
              <Info className="size-4" />
            </PvButton>
          }
        />
      )}
      {item !== undefined && panelState.panel?.kind === 'item' && (
        <ItemPanel
          key={item.folder}
          item={item}
          tab={tabFor({ item, asked: panelState.panel.tab })}
          onTabChange={(tab) => panelState.showTab({ folder: item.folder, tab })}
          expanded={panelState.expanded}
          onExpandedChange={panelState.setExpanded}
          onClose={panelState.close}
        />
      )}
      {panelState.panel?.kind === 'guide' && boardView !== undefined && (
        <Panel
          title={GUIDE_TITLE}
          expanded={panelState.expanded}
          onExpandedChange={panelState.setExpanded}
          onClose={panelState.close}
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Prose html={boardView.guideHtml} className="mx-auto max-w-3xl" />
          </div>
        </Panel>
      )}
      <WriteCard />
    </div>
  );
};
