import { useRef, type FC, type PropsWithChildren } from 'react';
import { useScrollFadeEffect } from '@pacevault/ui/hooks/useScrollFadeEffect.ts';

export const CardBody: FC<PropsWithChildren> = (props) => {
  const ref = useRef<HTMLDivElement>(null);
  useScrollFadeEffect(ref);
  return (
    <div
      ref={ref}
      className="scroll-fade -mx-6 mt-8 min-h-0 flex-1 overflow-y-auto overscroll-contain px-6"
    >
      {props.children}
    </div>
  );
};
