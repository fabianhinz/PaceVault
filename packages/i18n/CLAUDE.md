# @pacevault/i18n

**WHY:** The translations of PaceVault in one package, so the app and the shared packages import the same compiled messages without a provider.
**WHAT:** Paraglide.js messages in `messages/{en,de}.json`, the inlang project in `project.inlang/`, the compile options in `paraglide.config.ts`. The compiled output lands in `src/paraglide/` (generated, gitignored) and is imported as `@pacevault/i18n/messages.js` and `@pacevault/i18n/runtime.js`. Shared code rules: root `CLAUDE.md` §2.

## Compiling

- `paraglide.config.ts` holds the options once (project, outdir, locale strategy `localStorage` → `preferredLanguage` → `baseLocale`); its paths are absolute, because paraglide resolves `outdir` against the caller's cwd.
- `vp run -F @pacevault/i18n compile` (`scripts/compile.ts`) writes `src/paraglide/`. The root `vp run check` and `vp run test` run it first; CI and deploy call it too.
- `i18nPlugin()` from `vite.ts` compiles on `vp dev` and `vp build` of the app and again whenever a message file changes.
- After adding or renaming a key outside a running dev server, compile before `vp check`, since the message types come from the generated files.

## Adding a key

1. Add the key to `messages/en.json`, then the same key with the same placeholders to `messages/de.json`.
2. Use it as `m.key_name()` with `import { m } from '@pacevault/i18n/messages.js'`.

## Translation rules

1. **Source of truth**: `en.json` defines all message keys. Every other `<lang>.json` must have exactly the same keys — no additions, no removals.
2. **Placeholders**: All `{variable}` tokens must be preserved exactly as in `en.json`. Never rename, reorder, or remove them.
3. **Tone**: Warm, direct, coach-like — not clinical or bureaucratic. Model after Garmin, Strava, and Komoot localization, not user manuals.
4. **Voice**: Active voice, direct address (informal "you" equivalent), short sentences. Prefer dashes over nested clauses.
5. **Technical terms**: Keep English sport/fitness terms that are standard in the target locale (TSS, FTP, VO2max, Threshold, Tempo). Don't force-translate established jargon.
6. **Labels vs descriptions**: Short UI labels stay terse. Longer descriptions and coaching text use conversational tone.
7. **Destructive actions**: Dialogs for delete/reset/clear stay clear and serious — no casual tone for irreversible operations.
8. **Analogies**: Metric explanations should sound like a knowledgeable friend, not a Wikipedia article. Use relatable comparisons.
9. **Compound nouns**: In languages prone to noun stacking (e.g. German), prefer verbal/prepositional rephrasing over long compound words.

## Verification

```bash
vp run -F @pacevault/i18n compile   # from the root
vp check                            # from packages/i18n
```
