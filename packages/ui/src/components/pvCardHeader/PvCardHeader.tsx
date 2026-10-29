import type { FC, ReactNode } from 'react';
import { PvTypography } from '../pvTypography/PvTypography.tsx';

type PvCardHeaderProps = {
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
} & ({ title: string; titleSlot?: ReactNode } | { title?: string; titleSlot: ReactNode });

export const PvCardHeader: FC<PvCardHeaderProps> = (props) => {
  const titleContent = props.titleSlot ?? (
    <PvTypography variant="title" as="h3">
      {props.title}
    </PvTypography>
  );

  const textBlock = (
    <div>
      {titleContent}
      {props.subtitle && (
        <PvTypography variant="caption" as="p">
          {props.subtitle}
        </PvTypography>
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
