import { createContext } from 'react';

interface SheetPeekContextValue {
  target: HTMLDivElement | null;
  registerTarget: (element: HTMLDivElement | null) => void;
  active: boolean;
  setActive: (active: boolean) => void;
}

export const SheetPeekContext = createContext<SheetPeekContextValue>({
  target: null,
  registerTarget: () => {},
  active: false,
  setActive: () => {},
});
