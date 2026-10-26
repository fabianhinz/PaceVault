import type { FC } from 'react';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { BannerFrame } from '../bannerContent.ts';
import { FRAME_HEIGHT_CLASS } from './frameSize.ts';
import { Shot } from './Shot.tsx';

interface FrameShotsProps {
  frame: BannerFrame;
}

export const FrameShots: FC<FrameShotsProps> = (props) => {
  if (props.frame.below === undefined) {
    return <Shot file={props.frame.file} fit="cover" className={FRAME_HEIGHT_CLASS} />;
  }
  return (
    <div className={cn('flex', FRAME_HEIGHT_CLASS, 'flex-col gap-2')}>
      <Shot file={props.frame.file} fit="cover" className="h-398px" />
      <Shot file={props.frame.below} fit="contain" className="h-150px" />
    </div>
  );
};
