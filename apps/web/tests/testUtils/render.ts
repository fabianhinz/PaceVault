import type { ReactElement } from 'react';
import {
  render,
  renderHook,
  type RenderHookResult,
  type RenderResult,
} from '@testing-library/react';
import { createTestProviders, type ProviderOptions } from '@testUtils/testProviders.tsx';

export const renderWithProviders = (
  ui: ReactElement,
  options: ProviderOptions = {},
): RenderResult => render(ui, { wrapper: createTestProviders(options) });

export const renderHookWithProviders = <Result, Props>(
  hook: (initialProps: Props) => Result,
  options: ProviderOptions & { initialProps?: Props } = {},
): RenderHookResult<Result, Props> =>
  renderHook(hook, { wrapper: createTestProviders(options), initialProps: options.initialProps });
