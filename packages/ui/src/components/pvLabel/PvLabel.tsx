import type { ComponentProps, FC } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '../../lib/cn.ts';

interface PvLabelProps extends ComponentProps<typeof LabelPrimitive.Root> {
  required?: boolean;
}

export const PvLabel: FC<PvLabelProps> = (props) => {
  const { className: _className, required: _required, children: _children, ...rest } = props;
  return (
    <LabelPrimitive.Root
      className={cn(
        'block text-sm font-medium text-text-secondary mb-1.5 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        props.className,
      )}
      {...rest}
    >
      {props.children}
      {props.required && (
        <span aria-hidden className="ml-0.5">
          *
        </span>
      )}
    </LabelPrimitive.Root>
  );
};
