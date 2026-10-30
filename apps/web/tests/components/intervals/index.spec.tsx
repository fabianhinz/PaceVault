import { describe, it, expect, beforeEach } from 'vite-plus/test';
import { waitFor } from '@testing-library/react';
import { m } from '@pacevault/i18n/messages.js';
import { renderWithProviders } from '@testUtils/render.ts';
import { createTestQueryClient } from '@testUtils/queryClient.ts';
import { Intervals } from '@/components/intervals/index.tsx';
import { intervalsSyncQueryKey } from '@/queries/intervals/useIntervalsSync.ts';
import { useIntervalsStore } from '@/store/intervals.ts';
import { useUserStore } from '@/store/user.ts';
import { createMockUserProfile } from '@tests/factories/profiles.ts';

describe(Intervals.name, () => {
  beforeEach(() => {
    useUserStore.setState({ profile: createMockUserProfile() });
    useIntervalsStore.getState().connectIntervals('key');
  });

  it('enables Import while no sync runs', () => {
    const view = renderWithProviders(<Intervals />);

    expect(view.getByRole('button', { name: m.ui_intervals_import_activities() })).toBeEnabled();
  });

  it('disables Import while a sync runs', async () => {
    const queryClient = createTestQueryClient();
    void queryClient.fetchQuery({
      queryKey: intervalsSyncQueryKey(),
      queryFn: () => new Promise<never>(() => {}),
    });

    const view = renderWithProviders(<Intervals />, { queryClient });

    await waitFor(() =>
      expect(view.getByRole('button', { name: m.ui_intervals_import_activities() })).toBeDisabled(),
    );
  });
});
