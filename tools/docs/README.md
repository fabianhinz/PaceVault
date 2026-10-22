# @pacevault/docs

Produces PaceVault's documentation assets. Its first job is the README banner (`docs/banners/<locale>_banner.png`).

## Banner

```bash
vp run docs:banner                 # from the root; German (default) → docs/banners/de_banner.png
vp run docs:banner --locale en     # English → docs/banners/en_banner.png
```

Loads the demo data in Playwright with a frozen clock against the web app's dev server (`apps/web`, port 5175), captures each tile in that locale (`banner/capture.ts`) and renders the banner page (`banner/page/`, served by this package's own dev server on port 5177) to `docs/banners/<locale>_banner.png`. Banner texts per locale live in `banner/tiles.ts`. It runs the full Chromium build in headless mode on the GPU, so glass surfaces render as on a real device. It needs network access for the map tiles; set `VITE_CARTO_API_KEY` in `apps/web/.env.local` if you have one. Raw tile shots land in `banner/out/<locale>/` (gitignored). The capture is not part of the e2e suite.

## Run and test

```bash
vp check   # from tools/docs; no tests of its own
```

## Depends on

- `@pacevault/web`: entry points listed in its `exports` (demo schedule, layout store, Open-Meteo fixture) for the capture, and its `public/` folder (favicon) for the banner page.
- `@pacevault/ui`: theme (`theme.css`), `Card`, `Typography` and `cn` for the banner page.
