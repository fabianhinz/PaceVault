import type { QueryClient } from '@tanstack/react-query';
import { createQueryClient } from '@/queries/queryClient.ts';

export const createTestQueryClient = (): QueryClient =>
  createQueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
