import { resolve } from 'node:path';
import type { CompilerOptions } from '@inlang/paraglide-js';

// Paths are absolute because paraglide resolves `outdir` against the cwd of whoever calls it.
export const paraglideConfig = {
  project: resolve(import.meta.dirname, 'project.inlang'),
  outdir: resolve(import.meta.dirname, 'src/paraglide'),
  strategy: ['localStorage', 'preferredLanguage', 'baseLocale'],
} satisfies CompilerOptions;
