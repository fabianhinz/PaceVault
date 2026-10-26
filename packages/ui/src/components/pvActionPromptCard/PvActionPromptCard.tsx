import type { FC, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import { PvCard } from '../pvCard/PvCard.tsx';
import { PvTypography } from '../pvTypography/PvTypography.tsx';

interface PvActionPromptCardProps {
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
  branded?: boolean;
}

export const PvActionPromptCard: FC<PvActionPromptCardProps> = (props) => {
  return (
    <PvCard
      className={cn(
        'flex flex-col items-center justify-center py-12 gap-4',
        props.branded &&
          "bg-[linear-gradient(color-mix(in_srgb,var(--color-surface-base)_90%,transparent),color-mix(in_srgb,var(--color-surface-base)_90%,transparent)),url('/logo.svg')] bg-surface-base bg-left-top bg-no-repeat bg-[length:12rem]",
        props.className,
      )}
    >
      <PvTypography variant="h2" color="textPrimary">
        {props.title}
      </PvTypography>
      <PvTypography variant="body1" color="textSecondary" className="text-center max-w-md">
        {props.description}
      </PvTypography>
      {props.children}
    </PvCard>
  );
};
