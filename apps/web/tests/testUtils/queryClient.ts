import type { QueryClient } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/queryClient.ts';

export const createTestQueryClient = (): QueryClient =>
  createQueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
