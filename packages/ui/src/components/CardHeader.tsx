import type { ReactNode } from 'react';
import { Typography } from './Typography.tsx';

type CardHeaderProps = {
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
} & ({ title: string; titleSlot?: ReactNode } | { title?: string; titleSlot: ReactNode });

export const CardHeader = (props: CardHeaderProps) => {
  const titleContent = props.titleSlot ?? (
    <Typography variant="title" as="h3">
      {props.title}
    </Typography>
  );

  const textBlock = (
    <div>
      {titleContent}
      {props.subtitle && (
        <Typography variant="caption" as="p">
          {props.subtitle}
        </Typography>
      )}
    </div>
  );

  if (props.icon) {
    return (
      <div className="mb-4 flex items-center gap-2">
        {props.icon}
        {textBlock}
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-start justify-between gap-2">
      {textBlock}
      {props.actions && <div className="shrink-0">{props.actions}</div>}
    </div>
  );
};
