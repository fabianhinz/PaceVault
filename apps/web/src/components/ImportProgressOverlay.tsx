import type { FC } from 'react';
import { useImportProgressStore } from '@/store/importProgress.ts';
import { OverlayContent } from '@/components/OverlayContent.tsx';
import { useHeldReprocess } from '@/components/useHeldReprocess.ts';

export const ImportProgressOverlay: FC = () => {
  const foreground = useImportProgressStore((s) => s.foreground);
  const held = useHeldReprocess(foreground);
  const shown = foreground ?? held;
  if (shown === null) return null;
  return <OverlayContent key={shown.openedAt} foreground={shown} />;
};
