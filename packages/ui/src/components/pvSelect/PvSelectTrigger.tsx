import type { ComponentProps, FC } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn.ts';
import { PvTypography } from '../pvTypography/PvTypography.tsx';

export const PvSelectTrigger: FC<ComponentProps<typeof SelectPrimitive.Trigger>> = (props) => {
  const { className: _className, children: _children, color: _color, ...rest } = props;
  return (
    <PvTypography
      as={SelectPrimitive.Trigger}
      variant="body1"
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 cursor-pointer placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50',
        props.className,
      )}
      {...rest}
    >
      {props.children}
      <SelectPrimitive.Icon>
        <ChevronDown size={12} strokeWidth={1.5} className="text-text-tertiary" />
      </SelectPrimitive.Icon>
    </PvTypography>
  );
};
