import { createContext, useContext, useState, type FC, type PropsWithChildren } from 'react';
import type { SheetAboveMotion } from './types.ts';

interface SheetScrollContextValue {
  element: HTMLDivElement | null;
  register: (element: HTMLDivElement | null) => void;
}

interface SheetAboveContextValue {
  motion: SheetAboveMotion | null;
  registerMotion: (motion: SheetAboveMotion | null) => void;
}

interface SheetPeekContextValue {
  target: HTMLDivElement | null;
  registerTarget: (element: HTMLDivElement | null) => void;
  active: boolean;
  setActive: (active: boolean) => void;
}

const SheetScrollContext = createContext<SheetScrollContextValue | undefined>(undefined);
const SheetAboveContext = createContext<SheetAboveContextValue | undefined>(undefined);
const SheetPeekContext = createContext<SheetPeekContextValue | undefined>(undefined);

export const useSheetScrollContext = (): SheetScrollContextValue => {
  const sheetScroll = useContext(SheetScrollContext);
  if (sheetScroll === undefined) {
    throw new Error('useSheetScrollContext must be used inside PvBottomSheetProvider');
  }
  return sheetScroll;
};

export const useUnstableSheetScrollContext = (): SheetScrollContextValue | undefined =>
  useContext(SheetScrollContext);

export const useSheetAboveContext = (): SheetAboveContextValue => {
  const sheetAbove = useContext(SheetAboveContext);
  if (sheetAbove === undefined) {
    throw new Error('useSheetAboveContext must be used inside PvBottomSheetProvider');
  }
  return sheetAbove;
};

export const useUnstableSheetAboveContext = (): SheetAboveContextValue | undefined =>
  useContext(SheetAboveContext);

export const useSheetPeekContext = (): SheetPeekContextValue => {
  const sheetPeek = useContext(SheetPeekContext);
  if (sheetPeek === undefined) {
    throw new Error('useSheetPeekContext must be used inside PvBottomSheetProvider');
  }
  return sheetPeek;
};

export const useUnstableSheetPeekContext = (): SheetPeekContextValue | undefined =>
  useContext(SheetPeekContext);

export const PvBottomSheetProvider: FC<PropsWithChildren> = (props) => {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [peekTarget, setPeekTarget] = useState<HTMLDivElement | null>(null);
  const [peekActive, setPeekActive] = useState(false);
  const [aboveMotion, setAboveMotion] = useState<SheetAboveMotion | null>(null);
  return (
    <SheetScrollContext.Provider value={{ element, register: setElement }}>
      <SheetAboveContext.Provider value={{ motion: aboveMotion, registerMotion: setAboveMotion }}>
        <SheetPeekContext.Provider
          value={{
            target: peekTarget,
            registerTarget: setPeekTarget,
            active: peekActive,
            setActive: setPeekActive,
          }}
        >
          {props.children}
        </SheetPeekContext.Provider>
      </SheetAboveContext.Provider>
    </SheetScrollContext.Provider>
  );
};
