import type { ComponentProps, FC } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../../lib/cn.ts';
import { PvTypography } from '../pvTypography/PvTypography.tsx';

export const PvDialogTitle: FC<ComponentProps<typeof DialogPrimitive.Title>> = (props) => {
  const { className: _className, children: _children, ...rest } = props;
  return (
    <DialogPrimitive.Title {...rest} asChild>
      <PvTypography
        as="h2"
        variant="title"
        className={cn('lg:text-lg lg:font-bold', props.className)}
      >
        {props.children}
      </PvTypography>
    </DialogPrimitive.Title>
  );
};
