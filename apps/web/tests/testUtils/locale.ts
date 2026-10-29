import { vi } from 'vite-plus/test';
import type { Locale } from '@pacevault/i18n/runtime.js';

// The formatters are built once at import with the locale active then (a language switch reloads
// the app), so a spec re-imports its subject on a fresh module graph after choosing the locale.
export const importInLocale = async <T>(locale: Locale, load: () => Promise<T>): Promise<T> => {
  vi.resetModules();
  const runtime = await import('@pacevault/i18n/runtime.js');
  runtime.overwriteGetLocale(() => locale);
  return load();
};
