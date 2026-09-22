import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils.ts';

interface LabelProps extends LabelPrimitive.LabelProps {
  required?: boolean;
}

export const Label = (props: LabelProps) => {
  const { className, required, children, ...rest } = props;
  return (
    <LabelPrimitive.Root
      className={cn(
        'block text-sm font-medium text-gray-300 mb-1.5 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...rest}
    >
      {children}
      {required && (
        <span aria-hidden className="ml-0.5">
          *
        </span>
      )}
    </LabelPrimitive.Root>
  );
};
