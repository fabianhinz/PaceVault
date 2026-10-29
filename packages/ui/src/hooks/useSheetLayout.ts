import { useCallback, useState } from 'react';
import { useEvent } from 'react-use';
import { readSheetLayout, type SheetLayout } from '../lib/sheetPosition.ts';

export const useSheetLayout = (): SheetLayout => {
  const [layout, setLayout] = useState(readSheetLayout);
  const handleResize = useCallback(() => setLayout(readSheetLayout()), []);
  useEvent('resize', handleResize);
  return layout;
};
