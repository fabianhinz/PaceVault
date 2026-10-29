import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { useLayoutStore } from '@/store/layout.ts';
import { PvBottomSheet } from '@pacevault/ui/components/pvBottomSheet/PvBottomSheet.tsx';
import { useOverscrollLockEffect } from '@/components/layout/useOverscrollLockEffect.ts';
import { RouteContent } from '@/components/layout/RouteContent.tsx';

export const MobileSheet: FC = () => {
  const position = useLayoutStore((s) => s.mobileSheetPosition);

  useOverscrollLockEffect();

  return (
    <PvBottomSheet
      position={position}
      onPositionChange={(next) => useLayoutStore.getState().setMobileSheetPosition(next)}
      expandLabel={m.ui_sheet_expand()}
      collapseLabel={m.ui_sheet_collapse()}
    >
      <main data-layout="main" className="relative pb-6">
        <RouteContent />
      </main>
    </PvBottomSheet>
  );
};
