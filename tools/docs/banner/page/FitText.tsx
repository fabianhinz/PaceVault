import { useLayoutEffect, useRef, type FC, type ReactNode } from 'react';
import { cn } from '@pacevault/ui/lib/cn.ts';

interface FitTextProps {
  children: ReactNode;
  className?: string;
}

export const FitText: FC<FitTextProps> = (props) => {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const container = ref.current;
    if (!container) return;
    for (const line of container.children) {
      if (line.scrollWidth > line.clientWidth + 1) line.setAttribute('data-overflow', '');
    }
  });
  return (
    <div
      ref={ref}
      className={cn(
        'min-w-0 [&>*]:block [&>*]:overflow-hidden [&>*]:whitespace-nowrap [zoom:1.5]',
        props.className,
      )}
    >
      {props.children}
    </div>
  );
};
