import { matchPath, useLocation } from 'react-router-dom';
import { PATTERN_BY_PAGE, type SupportedPage } from './pageRegistry.ts';

export interface RouteMatch {
  id: string | undefined;
}

export const useRouteMatch = (page: SupportedPage): RouteMatch | null => {
  const pathname = useLocation().pathname;
  const match = matchPath(PATTERN_BY_PAGE[page], pathname);
  if (match === null) return null;
  return { id: match.params.id };
};
