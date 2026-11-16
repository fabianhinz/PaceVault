import { z } from 'zod';

// apps/web/index.html applies the same rules before first paint; keep both in step.
const THEME_STORAGE_KEY = 'pacevault-theme';
const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)';

const themePreferenceSchema = z.enum(['system', 'light', 'dark']);

export type ThemePreference = z.infer<typeof themePreferenceSchema>;

type ResolvedTheme = 'light' | 'dark';

export const THEME_PREFERENCES = themePreferenceSchema.options;

const parseThemePreference = (stored: unknown): ThemePreference => {
  const parsed = themePreferenceSchema.safeParse(stored);
  if (parsed.success) return parsed.data;
  return 'system';
};

const resolveTheme = ({
  preference,
  systemPrefersDark,
}: {
  preference: ThemePreference;
  systemPrefersDark: boolean;
}): ResolvedTheme => {
  if (preference !== 'system') return preference;
  if (systemPrefersDark) return 'dark';
  return 'light';
};

export const readThemePreference = (): ThemePreference => {
  try {
    return parseThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'system';
  }
};

/**
 * Stores the choice and reloads, so module-level colour constants pick up the new theme. Without
 * storage (private mode, blocked site data) a reload would only bring back the old theme, so the
 * page stays as it is.
 */
export const saveThemePreference = (preference: ThemePreference): void => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    return;
  }
  window.location.reload();
};

/** With System chosen, a change of the system appearance reloads the app into the new theme. */
export const reloadOnSystemThemeChange = (): void => {
  window.matchMedia(SYSTEM_DARK_QUERY).addEventListener('change', (event) => {
    const theme = resolveTheme({
      preference: readThemePreference(),
      systemPrefersDark: event.matches,
    });
    if (theme !== document.documentElement.dataset.theme) window.location.reload();
  });
};
