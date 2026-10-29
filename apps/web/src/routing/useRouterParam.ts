import { useParams, useSearchParams } from 'react-router-dom';
import type { SupportedQuery } from './urlQuery.ts';

export const useRouterParam = (key: SupportedQuery): string | undefined => {
  const params = useParams();
  const searchParams = useSearchParams()[0];
  const pathValue = params[key];
  if (pathValue !== undefined) return pathValue;
  return searchParams.get(key) ?? undefined;
};
