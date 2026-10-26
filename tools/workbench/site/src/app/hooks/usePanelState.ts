import { useState } from 'react';
import type { BoardItem } from '@site/lib/board.ts';
import { SLOTS, type Slot } from '@site/lib/vocabulary.ts';

export type PanelContent =
  | { kind: 'item'; folder: string; tab: Slot }
  | { kind: 'guide' }
  | undefined;

export const tabFor = ({ item, asked }: { item: BoardItem; asked: Slot | undefined }): Slot => {
  if (asked !== undefined && item.present[asked]) return asked;
  const first = SLOTS.find((slot) => item.present[slot]);
  if (first === undefined) return 'plan';
  return first;
};

interface PanelState {
  panel: PanelContent;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  showTab: (target: { folder: string; tab: Slot }) => void;
  openItem: (target: { folder: string; asked: Slot | undefined }) => void;
  toggleGuide: () => void;
  close: () => void;
}

export const usePanelState = ({ items }: { items: BoardItem[] | undefined }): PanelState => {
  const [panel, setPanel] = useState<PanelContent>(undefined);
  const [expanded, setExpanded] = useState(false);

  /** A tab switch never changes the width: only Expand/Collapse does. */
  const showTab = ({ folder, tab }: { folder: string; tab: Slot }) =>
    setPanel({ kind: 'item', folder, tab });
  const openItem = ({ folder, asked }: { folder: string; asked: Slot | undefined }) => {
    const item = items?.find((candidate) => candidate.folder === folder);
    if (item === undefined) return;
    if (panel?.kind !== 'item' || panel.folder !== folder) setExpanded(false);
    showTab({ folder, tab: tabFor({ item, asked }) });
  };
  const toggleGuide = () => {
    if (panel?.kind === 'guide') {
      setPanel(undefined);
      return;
    }
    setPanel({ kind: 'guide' });
    setExpanded(false);
  };
  const close = () => setPanel(undefined);

  return { panel, expanded, setExpanded, showTab, openItem, toggleGuide, close };
};
