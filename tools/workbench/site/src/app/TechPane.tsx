import { useMemo, useRef, type FC } from 'react';
import { createPortal } from 'react-dom';
import { RotateCcw } from 'lucide-react';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvSegmentedControl } from '@pacevault/ui/components/pvSegmentedControl/PvSegmentedControl.tsx';
import type { BoardItem } from '@site/lib/board.ts';
import { resetFull } from '@site/scripts/tech.ts';
import { Stage } from './Stage.tsx';
import { useTechDiagramsEffect } from './hooks/useTechDiagramsEffect.ts';
import { useTechFullScreen } from './hooks/useTechFullScreen.ts';
import { useTechRefitEffect } from './hooks/useTechRefitEffect.ts';

interface TechPaneProps {
  item: BoardItem;
  expanded: boolean;
  active: boolean;
}

export const TechPane: FC<TechPaneProps> = (props) => {
  const pane = useRef<HTMLDivElement>(null);
  const fullScreen = useTechFullScreen();
  const techHtml = props.item.techHtml;
  const actualHtml = props.item.actualHtml ?? '';
  // React 19 sets innerHTML again for every new `__html` object, so these stay the same objects
  // until the HTML itself changes (else every render wipes the drawn figures). A new Actual side
  // or another item mounts the article afresh (its key), so the switch picks it up at Planned.
  const article = useMemo(() => ({ __html: techHtml ?? '' }), [techHtml]);
  const actual = useMemo(() => ({ __html: actualHtml }), [actualHtml]);

  useTechDiagramsEffect({
    pane,
    techHtml,
    actualHtml,
    folder: props.item.folder,
    expand: fullScreen.open,
  });
  useTechRefitEffect({ pane, expanded: props.expanded, active: props.active });

  return (
    <div ref={pane} className="mx-auto w-full max-w-3xl">
      <article
        key={`${props.item.folder}\n${actualHtml}`}
        data-tech={props.item.folder}
        className="wb-md tt-md"
        dangerouslySetInnerHTML={article}
      />
      <template data-actual dangerouslySetInnerHTML={actual} />
      {fullScreen.full !== undefined &&
        createPortal(
          <Stage
            label={fullScreen.label}
            path={fullScreen.path}
            expandable
            full
            onFullChange={fullScreen.close}
            bodyRef={fullScreen.bodyRef}
            bodyClassName={fullScreen.diagram ? 'tt-full__body' : 'tt-full__frame'}
            lead={
              fullScreen.control !== undefined && (
                <PvSegmentedControl
                  size="sm"
                  aria-label={`${fullScreen.control.name}: planned or actual`}
                  value={fullScreen.control.isActual() ? 'actual' : 'planned'}
                  onValueChange={(side) => void fullScreen.switchTo(side === 'actual')}
                  options={[
                    { value: 'planned', label: 'Planned' },
                    {
                      value: 'actual',
                      label: 'Actual',
                      disabled: fullScreen.control.hint !== undefined,
                      tooltip: fullScreen.control.hint,
                    },
                  ]}
                />
              )
            }
            actions={
              fullScreen.diagram && (
                <PvButton
                  variant="ghost"
                  size="icon"
                  aria-label="Reset view"
                  title="Reset view (or double-click)"
                  onClick={() => {
                    if (fullScreen.body.current !== null) resetFull(fullScreen.body.current);
                  }}
                >
                  <RotateCcw className="size-4" />
                </PvButton>
              )
            }
          />,
          document.body,
        )}
    </div>
  );
};
