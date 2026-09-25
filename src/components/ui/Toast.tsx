import * as ToastPrimitive from '@radix-ui/react-toast';
import { cn } from '@/lib/utils.ts';
import { useToastStore } from './toastStore.ts';
import type { ProgressToastItem } from './toastStore.ts';

const variantClasses: Record<string, string> = {
  default: 'border-white/10',
  success: 'border-status-success-strong/30',
  error: 'border-status-danger-strong/30',
  warning: 'border-status-warning-strong/30',
};

const SIZE = 20;
const STROKE = 2.5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const ProgressSpinner = (props: { item: ProgressToastItem }) => {
  const saving = props.item.saving;
  const pct =
    props.item.total > 0 ? Math.min(props.item.processed, props.item.total) / props.item.total : 0;
  const offset = saving ? CIRCUMFERENCE * 0.75 : CIRCUMFERENCE * (1 - pct);

  return (
    <svg width={SIZE} height={SIZE} className={cn('-rotate-90', saving && 'animate-spin')}>
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE}
        className="text-white/10"
      />
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={cn('text-accent', !saving && 'transition-[stroke-dashoffset] duration-500')}
      />
    </svg>
  );
};

export const ToastViewport = () => {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((t) => {
        if (t.kind === 'progress') {
          return (
            <ToastPrimitive.Root
              key={t.id}
              className={cn(
                'rounded-lg border border-white/10 p-4 bg-white/5 backdrop-blur-xl flex items-center gap-2',
                'data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-bottom-4',
                'data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-bottom-4',
              )}
              duration={Infinity}
              onSwipeStart={(e) => e.preventDefault()}
            >
              <ProgressSpinner item={t} />
              <ToastPrimitive.Title className="text-sm font-semibold text-text-primary">
                {t.label}
              </ToastPrimitive.Title>
            </ToastPrimitive.Root>
          );
        }

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
