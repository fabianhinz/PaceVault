import { activeTheme, type ThemeName } from '@pacevault/ui/lib/tokens.ts';

export type MapTheme = 'dark' | 'light';

const mapThemeOf = (theme: ThemeName): MapTheme => {
  if (theme === 'light') return 'light';
  return 'dark';
};

// The app reloads on a theme change, so the theme at module load holds for the whole session.
export const MAP_THEME = mapThemeOf(activeTheme);
