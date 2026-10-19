import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { paraglideConfig } from './paraglide.config.ts';

// Compiles the messages on dev and build start and again whenever a message file changes.
export const i18nPlugin = () => paraglideVitePlugin(paraglideConfig);
