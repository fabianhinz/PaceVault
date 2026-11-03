import type { FC, ReactNode } from 'react';
import { useMeasure } from 'react-use';

interface SizedProps {
  children: (size: { width: number; height: number }) => ReactNode;
}

// Recharts warns about a 0×0 container while the shell hides a frame; render only with a real size.
export const Sized: FC<SizedProps> = (props) => {
  const [ref, size] = useMeasure<HTMLDivElement>();
  return (
    <div ref={ref} className="h-full w-full">
      {size.width > 0 && size.height > 0 && props.children({ width: size.width, height: size.height })}
    </div>
  );
};
