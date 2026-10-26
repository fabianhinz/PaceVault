import { matchPath, useLocation } from 'react-router-dom';
import { PAGE_PATTERNS, type SupportedPage } from './pageRegistry.ts';

export interface RouteMatch {
  id: string | undefined;
}

export const useRouteMatch = (page: SupportedPage): RouteMatch | null => {
  const pathname = useLocation().pathname;
  const match = matchPath(PAGE_PATTERNS[page], pathname);
  if (match === null) return null;
  return { id: match.params.id };
};
