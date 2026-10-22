# @pacevault/web

The PaceVault PWA: a local-first training log for runners and cyclists that runs entirely in the browser. User-facing overview: the [root README](../../README.md). Rules for working on the app: [`CLAUDE.md`](./CLAUDE.md).

## Run

```bash
vp dev       # from apps/web, or from the root (defaultPackage)
vp build     # production build into apps/web/dist
vp preview
```

Environment: put `VITE_CARTO_API_KEY` in `apps/web/.env.local` (Vite reads env files from this folder; see `.env.example`).

## Test

```bash
vp check                  # fmt + lint + types
vp test -- --run          # tests/ (unit and integration, jsdom, tests/setup.ts)
vp exec playwright test   # e2e/ (starts its own dev server on port 5174)
```

## Other scripts

- `vp run generate-demo-routes`: regenerate `src/features/demo/demoRoutes.json`
- `vp run generate-pwa-assets`: regenerate the PWA icons in `public/`

Deployment: `firebase.json` and `.firebaserc` live here; the deploy workflow passes `entryPoint: apps/web`.

UI components, theme tokens and the generic UI hooks come from `@pacevault/ui` (`packages/ui`); `src/index.css` imports its `theme.css` and keeps the app base styles.

Translations come from `@pacevault/i18n` (`packages/i18n`); `vp dev` and `vp build` compile them through its `i18nPlugin()`, and `vp run -F @pacevault/i18n compile` (from the root) compiles them on their own.

## Depends on it

- `tools/docs` (`@pacevault/docs`): the README banner captures the running app and imports a few entry points (`exports` in `package.json`: demo schedule, layout store, Open-Meteo fixture)
- `tools/workbench`: review captures run against its dev server and reuse `e2e/helpers`
