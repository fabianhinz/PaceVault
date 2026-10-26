import type { FC, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { PvChip } from '../pvChip/PvChip.tsx';
import { PvTypography } from '../pvTypography/PvTypography.tsx';
import { PvDialogTitle } from './PvDialogTitle.tsx';

interface PvDialogHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  chip?: string;
  actions?: ReactNode;
}

export const PvDialogHeader: FC<PvDialogHeaderProps> = (props) => {
  const Icon = props.icon;
  return (
    <div className="flex min-h-11 shrink-0 items-center gap-2 px-5 lg:min-h-0 lg:p-0">
      {Icon && <Icon className="size-4 shrink-0 text-text-tertiary lg:hidden" />}
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <PvDialogTitle className="max-lg:truncate">{props.title}</PvDialogTitle>
          {props.chip !== undefined && <PvChip className="shrink-0">{props.chip}</PvChip>}
        </div>
        {props.subtitle !== undefined && (
          <PvTypography variant="caption" as="p">
            {props.subtitle}
          </PvTypography>
        )}
      </div>
      {props.actions !== undefined && (
        <div className="ml-auto flex shrink-0 items-center gap-2">{props.actions}</div>
      )}
    </div>
  );
};
