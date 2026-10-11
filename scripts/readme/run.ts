import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { README_LOCALE_ENV } from './env.ts';
import { BANNER_LOCALES, DEFAULT_BANNER_LOCALE, isBannerLocale } from './tiles.ts';

/**
 * `vp run readme:banner [--locale de|en]`: captures the tiles in that locale and writes
 * `docs/readme/<locale>_banner.png`. Defaults to German.
 */
const args = parseArgs({
  options: { locale: { type: 'string', default: DEFAULT_BANNER_LOCALE } },
  allowPositionals: true,
});
const locale = args.values.locale;
if (!isBannerLocale(locale)) {
  console.error(`--locale must be one of: ${BANNER_LOCALES.join(', ')}`);
  process.exit(1);
}

const result = spawnSync(
  'vp',
  ['exec', 'playwright', 'test', '-c', resolve(import.meta.dirname, 'playwright.config.ts')],
  { stdio: 'inherit', env: { ...process.env, [README_LOCALE_ENV]: locale } },
);
process.exit(result.status ?? 1);
