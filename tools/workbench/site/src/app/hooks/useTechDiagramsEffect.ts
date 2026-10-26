import { useEffect, type RefObject } from 'react';
import { initTech } from '@site/scripts/tech.ts';

export const useTechDiagramsEffect = (options: {
  pane: RefObject<HTMLDivElement | null>;
  techHtml: string | undefined;
  actualHtml: string;
  folder: string;
  expand: (frame: HTMLElement) => void;
}): void => {
  const pane = options.pane;
  const techHtml = options.techHtml;
  const actualHtml = options.actualHtml;
  const folder = options.folder;
  const expand = options.expand;
  useEffect(() => {
    const element = pane.current;
    if (element === null || techHtml === undefined) return;
    initTech({ pane: element, expand });
  }, [pane, techHtml, actualHtml, folder, expand]);
};
