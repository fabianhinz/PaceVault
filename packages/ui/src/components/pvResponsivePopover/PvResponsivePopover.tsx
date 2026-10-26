import type { ComponentProps, FC, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useDevice } from '../../hooks/useDevice.ts';
import { PvPopover } from '../pvPopover/PvPopover.tsx';
import { PvPopoverTrigger } from '../pvPopover/PvPopoverTrigger.tsx';
import { PvPopoverContent } from '../pvPopover/PvPopoverContent.tsx';
import { PvDialog } from '../pvDialog/PvDialog.tsx';
import { PvDialogTrigger } from '../pvDialog/PvDialogTrigger.tsx';
import { PvDialogContent } from '../pvDialog/PvDialogContent.tsx';
import { PvDialogHeader } from '../pvDialog/PvDialogHeader.tsx';
import { PvDialogBody } from '../pvDialog/PvDialogBody.tsx';
import { PvResponsivePopoverPointAnchor } from './PvResponsivePopoverPointAnchor.tsx';

interface PvResponsivePopoverProps
  extends
    Pick<ComponentProps<typeof PvPopoverContent>, 'side' | 'align' | 'collisionPadding'>,
    Pick<ComponentProps<typeof PvPopover>, 'open' | 'onOpenChange'> {
  trigger?: ReactNode;
  anchor?: { x: number; y: number };
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  chip?: string;
  bleed?: boolean;
  closeLabel: string;
  className?: string;
  children: ReactNode;
}

export const PvResponsivePopover: FC<PvResponsivePopoverProps> = (props) => {
  const device = useDevice();

  if (device.desktop) {
    return (
      <PvPopover open={props.open} onOpenChange={props.onOpenChange}>
        {props.anchor && <PvResponsivePopoverPointAnchor x={props.anchor.x} y={props.anchor.y} />}
        {props.trigger !== undefined && (
          <PvPopoverTrigger asChild>{props.trigger}</PvPopoverTrigger>
        )}
        <PvPopoverContent
          side={props.side}
          align={props.align}
          collisionPadding={props.collisionPadding}
          className={props.className}
        >
          {props.children}
        </PvPopoverContent>
      </PvPopover>
    );
  }

  return (
    <PvDialog open={props.open} onOpenChange={props.onOpenChange}>
      {props.trigger !== undefined && <PvDialogTrigger asChild>{props.trigger}</PvDialogTrigger>}
      <PvDialogContent aria-describedby={undefined} closeLabel={props.closeLabel}>
        <PvDialogHeader
          title={props.title}
          subtitle={props.subtitle}
          icon={props.icon}
          chip={props.chip}
        />
        <PvDialogBody className={props.bleed ? 'flex flex-col overflow-hidden p-0' : undefined}>
          {props.children}
        </PvDialogBody>
      </PvDialogContent>
    </PvDialog>
  );
};
