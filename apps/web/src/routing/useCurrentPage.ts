import { matchPath, useLocation } from 'react-router-dom';
import { PAGE_PATTERNS, SUPPORTED_PAGES, type SupportedPage } from './pageRegistry.ts';

export const useCurrentPage = (): SupportedPage | null => {
  const pathname = useLocation().pathname;
  const page = Object.values(SUPPORTED_PAGES).find(
    (candidate) => matchPath(PAGE_PATTERNS[candidate], pathname) !== null,
  );
  if (page === undefined) return null;
  return page;
};
