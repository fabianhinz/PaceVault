import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { fireEvent, waitFor, within } from '@testing-library/react';
import { mock } from 'vitest-mock-extended';
import { m } from '@pacevault/i18n/messages.js';
import { ThemeListItem } from '@/components/settings/ThemeListItem.tsx';
import { renderWithProviders } from '@testUtils/render.ts';

let reload: ReturnType<typeof vi.fn<() => void>>;

beforeEach(() => {
  reload = vi.fn<() => void>();
  vi.stubGlobal('location', mock<Location>({ reload }));
  // jsdom has no layout; Radix Select scrolls the selected option into view on open.
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(ThemeListItem.name, () => {
  it('stores the chosen theme and reloads the page', async () => {
    const view = renderWithProviders(<ThemeListItem />);

    fireEvent.keyDown(view.getByRole('combobox', { name: m.ui_settings_theme() }), {
      key: 'Enter',
    });
    await waitFor(() => expect(view.getByRole('listbox')).toBeInTheDocument());
    fireEvent.click(
      within(view.getByRole('listbox')).getByRole('option', { name: m.ui_settings_theme_light() }),
    );

    expect(localStorage.getItem('pacevault-theme')).toBe('light');
    expect(reload).toHaveBeenCalledWith();
  });
});
