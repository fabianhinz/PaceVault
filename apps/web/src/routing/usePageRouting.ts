import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { pageUrl, type PageTarget } from './pageRegistry.ts';

export interface PageRouting {
  open: (target: PageTarget) => void;
}

export const usePageRouting = (): PageRouting => {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      open: (target) => {
        void navigate(pageUrl(target));
      },
    }),
    [navigate],
  );
};
