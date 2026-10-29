import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { SupportedQuery } from './urlQuery.ts';

export interface RouterQuery {
  push: ({ key, value }: { key: SupportedQuery; value: string }) => void;
}

export const useRouterQuery = (): RouterQuery => {
  const setSearchParams = useSearchParams()[1];
  return useMemo(
    () => ({
      push: ({ key, value }) => {
        setSearchParams({ [key]: value });
      },
    }),
    [setSearchParams],
  );
};
