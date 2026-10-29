import type { ComponentProps, FC } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../../lib/cn.ts';
import { PvTypography } from '../pvTypography/PvTypography.tsx';

export const PvDialogDescription: FC<ComponentProps<typeof DialogPrimitive.Description>> = (
  props,
) => {
  const { className: _className, children: _children, ...rest } = props;
  return (
    <DialogPrimitive.Description {...rest} asChild>
      <PvTypography variant="body1" color="textTertiary" className={cn('lg:mt-2', props.className)}>
        {props.children}
      </PvTypography>
    </DialogPrimitive.Description>
  );
};
