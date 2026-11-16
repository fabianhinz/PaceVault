import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { mock } from 'vitest-mock-extended';
import {
  readThemePreference,
  reloadOnSystemThemeChange,
  saveThemePreference,
} from '@/lib/theme/theme.ts';

const THEME_STORAGE_KEY = 'pacevault-theme';

let reload: ReturnType<typeof vi.fn<() => void>>;

beforeEach(() => {
  reload = vi.fn<() => void>();
  vi.stubGlobal('location', mock<Location>({ reload }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.theme;
});

describe(readThemePreference.name, () => {
  it('falls back to system when nothing is stored', () => {
    expect(readThemePreference()).toBe('system');
  });

  it('returns a stored choice', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');

    expect(readThemePreference()).toBe('light');
  });

  it('falls back to system for an unknown stored value', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'sepia');

    expect(readThemePreference()).toBe('system');
  });
});

describe(saveThemePreference.name, () => {
  it('stores the choice and reloads the page', () => {
    saveThemePreference('dark');

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(reload).toHaveBeenCalledWith();
  });

  it('keeps the page when the choice cannot be stored', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });

    saveThemePreference('light');

    expect(reload).not.toHaveBeenCalled();
    setItem.mockRestore();
  });
});

describe(reloadOnSystemThemeChange.name, () => {
  let mediaQueryList: ReturnType<typeof mock<MediaQueryList>>;

  const changeSystemTheme = (systemPrefersDark: boolean) => {
    const listener = mediaQueryList.addEventListener.mock.calls[0]?.[1];
    if (typeof listener !== 'function') throw new Error('no change listener registered');
    listener.call(mediaQueryList, mock<MediaQueryListEvent>({ matches: systemPrefersDark }));
  };

  beforeEach(() => {
    mediaQueryList = mock<MediaQueryList>();
    window.matchMedia = vi.fn(() => mediaQueryList);
  });

  it('reloads with System chosen when the system turns light under a dark page', () => {
    document.documentElement.dataset.theme = 'dark';
    reloadOnSystemThemeChange();

    changeSystemTheme(false);

    expect(reload).toHaveBeenCalledWith();
  });

  it('keeps the page when a fixed choice already matches the shown theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    document.documentElement.dataset.theme = 'dark';
    reloadOnSystemThemeChange();

    changeSystemTheme(false);

    expect(reload).not.toHaveBeenCalled();
  });
});
