import type { FC, PropsWithChildren } from 'react';
import { SearchX } from 'lucide-react';
import { PvBanner } from '@pacevault/ui/components/pvBanner/PvBanner.tsx';

export const NotFoundBanner: FC<PropsWithChildren> = (props) => (
  <PvBanner variant="error" icon={SearchX}>
    {props.children}
  </PvBanner>
);
