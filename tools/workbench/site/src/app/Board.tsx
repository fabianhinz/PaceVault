import type { FC } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { overwriteGetLocale } from '@pacevault/i18n/runtime.js';
import { BoardPage } from './BoardPage.tsx';

// The board's own text is English; the kit's few Paraglide strings follow.
overwriteGetLocale(() => 'en');

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
});

export const Board: FC = () => (
  <QueryClientProvider client={queryClient}>
    <BoardPage />
  </QueryClientProvider>
);
