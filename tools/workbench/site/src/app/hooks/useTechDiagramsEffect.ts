import { useEffect, type RefObject } from 'react';
import { initTech } from '@site/scripts/tech.ts';

export const useTechDiagramsEffect = ({
  pane,
  techHtml,
  actualHtml,
  folder,
  expand,
}: {
  pane: RefObject<HTMLDivElement | null>;
  techHtml: string | undefined;
  actualHtml: string;
  folder: string;
  expand: (frame: HTMLElement) => void;
}): void => {
  useEffect(() => {
    const element = pane.current;
    if (element === null || techHtml === undefined) return;
    initTech({ pane: element, expand });
  }, [pane, techHtml, actualHtml, folder, expand]);
};
