import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { paraglideConfig } from './paraglide.config.ts';

export const i18nPlugin = () => paraglideVitePlugin(paraglideConfig);
