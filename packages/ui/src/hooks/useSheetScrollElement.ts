import { createContext, useContext } from 'react';

interface SheetScrollContextValue {
  element: HTMLDivElement | null;
  register: (element: HTMLDivElement | null) => void;
}

export const SheetScrollContext = createContext<SheetScrollContextValue>({
  element: null,
  register: () => {},
});

export const useSheetScrollElement = () => useContext(SheetScrollContext).element;
