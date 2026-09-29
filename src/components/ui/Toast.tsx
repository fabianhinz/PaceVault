import * as ToastPrimitive from '@radix-ui/react-toast';
import { cn } from '@/lib/utils.ts';
import { useToastStore } from './toastStore.ts';

const variantClasses: Record<string, string> = {
  default: 'border-white/10',
  success: 'border-status-success-strong/30',
  error: 'border-status-danger-strong/30',
  warning: 'border-status-warning-strong/30',
};

export const ToastViewport = () => {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((t) => {
        return (
          <ToastPrimitive.Root
            key={t.id}
            className={cn(
              'rounded-lg border p-4 bg-white/5 backdrop-blur-xl',
              'data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-bottom-4',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-bottom-4',
              variantClasses[t.variant ?? 'default'],
            )}
            onOpenChange={(open) => {
              if (!open) useToastStore.getState().removeToast(t.id);
            }}
            duration={t.persistent ? Infinity : 4000}
            data-testid={t.id}
          >
            <ToastPrimitive.Title className="text-sm font-semibold text-text-primary">
              {t.title}
            </ToastPrimitive.Title>
            {t.description && (
              <ToastPrimitive.Description className="mt-1 text-sm text-text-tertiary">
                {t.description}
              </ToastPrimitive.Description>
            )}
          </ToastPrimitive.Root>
        );
      })}
      <ToastPrimitive.Viewport className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex max-w-sm flex-col gap-2 rounded-lg" />
    </ToastPrimitive.Provider>
  );
};
