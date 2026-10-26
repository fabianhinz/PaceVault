import type { FC } from 'react';
import { useFileUpload } from '@/features/sessions/hooks/useFileUpload.ts';
import { useFileDropEffect } from '@/features/sessions/hooks/useFileDropEffect.ts';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { useDockList } from '@/components/layout/useDockList.ts';
import { DockBar } from '@/components/layout/DockBar.tsx';
import { DockRail } from '@/components/layout/DockRail.tsx';

export const Dock: FC = () => {
  const device = useDevice();
  const upload = useFileUpload();
  useFileDropEffect({ onDrop: upload.handleFiles, enabled: !upload.uploading });
  const list = useDockList();

  if (device.desktop) {
    return <DockRail list={list} />;
  }
  return <DockBar list={list} />;
};
