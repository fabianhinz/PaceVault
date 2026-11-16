import { m } from '@pacevault/i18n/messages.js';
import type { ThemePreference } from '@/lib/theme/theme.ts';

export const LABEL_BY_THEME_PREFERENCE: Record<ThemePreference, () => string> = {
  system: m.ui_settings_theme_system,
  light: m.ui_settings_theme_light,
  dark: m.ui_settings_theme_dark,
};
