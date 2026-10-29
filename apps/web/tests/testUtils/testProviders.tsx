import { StrictMode, type FC, type PropsWithChildren } from 'react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { createTestQueryClient } from '@testUtils/queryClient.ts';

export interface ProviderOptions {
  queryClient?: QueryClient;
  initialPath?: string;
  strict?: boolean;
}

export const createTestProviders = (options: ProviderOptions = {}): FC<PropsWithChildren> => {
  const queryClient = options.queryClient ?? createTestQueryClient();
  const initialEntries = [options.initialPath ?? '/'];
  const TestProviders: FC<PropsWithChildren> = (props) => {
    const stack = (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>{props.children}</MemoryRouter>
      </QueryClientProvider>
    );
    return options.strict === true ? <StrictMode>{stack}</StrictMode> : stack;
  };
  return TestProviders;
};
