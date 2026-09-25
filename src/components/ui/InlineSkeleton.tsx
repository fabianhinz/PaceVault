import { cn } from '@/lib/utils.ts';

interface InlineSkeletonProps {
  className?: string;
}

export const InlineSkeleton = (props: InlineSkeletonProps) => (
  <span
    className={cn(
      'inline-block h-3 w-12 animate-pulse rounded bg-white/10 align-middle',
      props.className,
    )}
  />
);
