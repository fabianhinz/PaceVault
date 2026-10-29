import type { FC } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cn } from '../../lib/cn.ts';
import { FLOATING_CLASS } from '../../lib/surfaces.ts';
import { PvTypography } from '../pvTypography/PvTypography.tsx';
import type { ToastItem, ToastVariant } from './types.ts';

const TOAST_DURATION_MS = 4000;

const CLASSES_BY_TOAST_VARIANT: Record<ToastVariant, string> = {
  default: 'border-white/10',
  success: 'border-status-success-strong/30',
  error: 'border-status-danger-strong/30',
  warning: 'border-status-warning-strong/30',
};

interface PvToastViewportProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const PvToastViewport: FC<PvToastViewportProps> = (props) => {
  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {props.toasts.map((t) => {
        return (
          <ToastPrimitive.Root
            key={t.id}
            className={cn(
              FLOATING_CLASS,
              'rounded-lg p-4',
              'data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-bottom-4',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-bottom-4',
              CLASSES_BY_TOAST_VARIANT[t.variant ?? 'default'],
            )}
            onOpenChange={(open) => {
              if (!open) props.onDismiss(t.id);
            }}
            duration={t.persistent ? Infinity : TOAST_DURATION_MS}
            data-testid={t.id}
          >
            <ToastPrimitive.Title asChild>
              <PvTypography as="div" variant="subtitle1" className="font-semibold">
                {t.title}
              </PvTypography>
            </ToastPrimitive.Title>
            {t.description && (
              <ToastPrimitive.Description asChild>
                <PvTypography as="div" variant="body1" color="textTertiary" className="mt-1">
                  {t.description}
                </PvTypography>
              </ToastPrimitive.Description>
            )}
          </ToastPrimitive.Root>
        );
      })}
      <ToastPrimitive.Viewport className="fixed bottom-dock-footprint lg:bottom-6 left-1/2 -translate-x-1/2 z-toast flex max-w-sm flex-col gap-2 rounded-lg" />
    </ToastPrimitive.Provider>
  );
};
