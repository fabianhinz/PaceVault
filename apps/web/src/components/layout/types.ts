export type DockItemKind = 'rail' | 'circle';

export interface DockList {
  open: boolean;
  close: () => void;
  toggle: () => void;
  handleTabClick: () => void;
}
