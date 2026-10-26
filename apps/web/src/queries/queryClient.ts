import { QueryClient, type QueryClientConfig } from '@tanstack/react-query';

export const createQueryClient = (config: QueryClientConfig = {}): QueryClient =>
  new QueryClient(config);
