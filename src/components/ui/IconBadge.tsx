import { cn } from '@/lib/utils.ts';

interface IconBadgeProps {
  show: boolean;
  children: React.ReactNode;
  className?: string;
}

/** Wraps an icon and overlays a small accent dot when `show` is true. */
export const IconBadge = (props: IconBadgeProps) => {
  return (
    <span className={cn('relative inline-flex', props.className)}>
      {props.children}
      {props.show && (
        <span
          data-testid="icon-badge"
          className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-accent"
        />
      )}
    </span>
  );
};
