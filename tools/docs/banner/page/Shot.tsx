import type { FC } from 'react';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { shotUrl } from './bannerLocale.ts';

type ShotFit = 'cover' | 'contain';

const CLASSES_BY_SHOT_FIT: Record<ShotFit, string> = {
  cover: 'object-cover object-top',
  contain: 'object-contain object-center',
};

interface ShotProps {
  file: string;
  fit: ShotFit;
  className?: string;
}

export const Shot: FC<ShotProps> = (props) => (
  <div
    className={cn(
      'min-h-0 min-w-0 overflow-hidden rounded-10px bg-surface-sunken',
      props.className,
    )}
  >
    <img
      src={shotUrl(props.file)}
      alt=""
      className={cn('block size-full', CLASSES_BY_SHOT_FIT[props.fit])}
    />
  </div>
);
