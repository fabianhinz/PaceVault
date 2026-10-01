import type { ReactNode } from 'react';
import { cn } from '@/lib/utils.ts';
import { Card } from './Card.tsx';
import { Typography } from './Typography.tsx';

interface ActionPromptCardProps {
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
  branded?: boolean;
}

export const ActionPromptCard = (props: ActionPromptCardProps) => {
  return (
    <Card
      className={cn(
        'flex flex-col items-center justify-center py-12 gap-4',
        props.branded &&
          "bg-[linear-gradient(color-mix(in_srgb,var(--color-surface-base)_90%,transparent),color-mix(in_srgb,var(--color-surface-base)_90%,transparent)),url('/logo.svg')] bg-surface-base bg-left-top bg-no-repeat bg-[length:12rem]",
        props.className,
      )}
    >
      <Typography variant="h2" color="textPrimary">
        {props.title}
      </Typography>
      <Typography variant="body1" color="textSecondary" className="text-center max-w-md">
        {props.description}
      </Typography>
      {props.children}
    </Card>
  );
};
