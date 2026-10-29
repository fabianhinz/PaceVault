import { useCallback, useState } from 'react';
import { useUnstableSheetScrollContext } from '@pacevault/ui/components/pvBottomSheet/PvBottomSheetProvider.tsx';
import type { DockList } from '@/components/layout/types.ts';

export const useDockList = (): DockList => {
  const [open, setOpen] = useState(false);
  const sheetScroller = useUnstableSheetScrollContext()?.element ?? null;

  const close = useCallback(() => setOpen(false), []);

  const toggle = () => {
    if (open) {
      close();
      return;
    }
    setOpen(true);
  };

  const handleTabClick = () => {
    close();
    if (sheetScroller) {
      sheetScroller.scrollTo({ top: 0 });
    } else {
      window.scrollTo({ top: 0 });
    }
  };

  return { open, close, toggle, handleTabClick };
};
