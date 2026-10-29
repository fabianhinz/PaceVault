import type { FC } from 'react';
import { PvToastViewport } from '@pacevault/ui/components/pvToastViewport/PvToastViewport.tsx';
import { useToastStore } from '@/store/toast.ts';

export const ToastHost: FC = () => {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <PvToastViewport toasts={toasts} onDismiss={(id) => useToastStore.getState().removeToast(id)} />
  );
};
