import { matchPath, useLocation } from 'react-router-dom';
import { PATTERN_BY_PAGE, type SupportedPage } from './pageRegistry.ts';

export interface RouteMatch {
  id: string | undefined;
}

// matchPath keeps path params percent-encoded, unlike useParams, so ids with reserved characters would not match.
const decodedParam = (value: string | undefined): string | undefined => {
  if (value === undefined) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const useRouteMatch = (page: SupportedPage): RouteMatch | null => {
  const pathname = useLocation().pathname;
  const match = matchPath(PATTERN_BY_PAGE[page], pathname);
  if (match === null) return null;
  return { id: decodedParam(match.params.id) };
};
