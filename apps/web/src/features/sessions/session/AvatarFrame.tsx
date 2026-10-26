import type { FC, PropsWithChildren } from 'react';
import { tokens } from '@pacevault/ui/lib/tokens.ts';

const AVATAR_SIZE = 30;

export const AvatarFrame: FC<PropsWithChildren> = (props) => (
  <svg
    width={AVATAR_SIZE}
    height={AVATAR_SIZE}
    viewBox="0 0 30 30"
    aria-hidden="true"
    data-testid="lap-strip-avatar"
  >
    <rect width="30" height="30" rx="6" fill={tokens.white4} />
    {props.children}
  </svg>
);
