import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { BANNER_LOCALE_ENV } from './env.ts';
import { BANNER_LOCALES, DEFAULT_BANNER_LOCALE, isBannerLocale } from './locales.ts';

const args = parseArgs({
  options: { locale: { type: 'string', default: DEFAULT_BANNER_LOCALE } },
  allowPositionals: true,
});
const locale = args.values.locale;
if (!isBannerLocale(locale)) {
  console.error(`--locale must be one of: ${BANNER_LOCALES.join(', ')}`);
  process.exit(1);
}

const playwrightRun = spawnSync(
  'vp',
  ['exec', 'playwright', 'test', '-c', resolve(import.meta.dirname, '..', 'playwright.config.ts')],
  { stdio: 'inherit', env: { ...process.env, [BANNER_LOCALE_ENV]: locale } },
);
process.exit(playwrightRun.status ?? 1);
