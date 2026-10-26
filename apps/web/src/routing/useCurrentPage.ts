import { matchPath, useLocation } from 'react-router-dom';
import { PATTERN_BY_PAGE, SUPPORTED_PAGES, type SupportedPage } from './pageRegistry.ts';

export const useCurrentPage = (): SupportedPage | null => {
  const pathname = useLocation().pathname;
  const page = Object.values(SUPPORTED_PAGES).find(
    (candidate) => matchPath(PATTERN_BY_PAGE[candidate], pathname) !== null,
  );
  if (page === undefined) return null;
  return page;
};
