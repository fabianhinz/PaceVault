import { ToastViewport } from '@pacevault/ui/components/Toast.tsx';
import { useToastStore } from '@/store/toast.ts';

export const ToastHost = () => {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <ToastViewport toasts={toasts} onDismiss={(id) => useToastStore.getState().removeToast(id)} />
  );
};
