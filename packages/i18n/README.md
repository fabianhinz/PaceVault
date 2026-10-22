# @pacevault/i18n

PaceVault's translations (English, German) as Paraglide.js messages, compiled once and imported by the app and the shared packages. Rules for writing messages: [`CLAUDE.md`](./CLAUDE.md).

## Use

```ts
import { m } from '@pacevault/i18n/messages.js';
import { getLocale, setLocale } from '@pacevault/i18n/runtime.js';
```

In a Vite config:

```ts
import { i18nPlugin } from '@pacevault/i18n/vite.ts';

export default defineConfig({ plugins: [i18nPlugin()] });
```

## Compile

```bash
vp run -F @pacevault/i18n compile   # writes src/paraglide/ (gitignored)
```

The root `vp run check` and `vp run test` compile first; `vp dev` and `vp build` of the app compile through `i18nPlugin()` and recompile when a message file changes.

## Layout

- `messages/{en,de}.json`: the messages; `en.json` defines the keys
- `project.inlang/`: inlang project settings
- `paraglide.config.ts`: compile options, shared by `scripts/compile.ts` and `vite.ts`

## Depends on it

- `apps/web` (`@pacevault/web`)
- `tools/docs`, `tools/workbench`: the captures read `messages/<locale>.json` directly
