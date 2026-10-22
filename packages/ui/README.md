# @pacevault/ui

PaceVault's UI kit: the Radix-based components (cards, dialogs, the bottom sheet family, tiles, charts cards, toasts, …), the theme tokens, and the generic UI hooks and helpers they need (`cn`, device and media queries, sheet drag and position, dock geometry, scroll fade, sliding highlight). Dark mode only, styled with Tailwind v4. Rules: [`CLAUDE.md`](./CLAUDE.md).

## Use

```ts
import { Card } from '@pacevault/ui/components/Card.tsx';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
```

```css
@import 'tailwindcss';
@import '@pacevault/ui/theme.css';
@source '<relative path to>/packages/ui/src';
```

The package exports its sources (`"./*": "./src/*"`); there is no build step. Tailwind does not scan workspace packages, so every consumer adds the `@source` line. Fixed texts come from `@pacevault/i18n`; there is no provider.

## Run and test

```bash
vp check           # from packages/ui (compile the translations first: vp run -F @pacevault/i18n compile)
vp test -- --run   # tests/**/*.spec.ts, jsdom
```

## Depends on it

- `apps/web` (`@pacevault/web`)
- `tools/docs` (`@pacevault/docs`): the README banner page
