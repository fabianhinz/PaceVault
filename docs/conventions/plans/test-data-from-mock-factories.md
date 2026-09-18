---
id: test-data-from-mock-factories
tdr_reference: tdr/test-data-from-mock-factories.md
generated: 2026-09-17
---

# Test data comes from mock factories, never from object literals

Read `tdr/test-data-from-mock-factories.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Bring the four existing factory modules onto the `createMock<Entity>` contract.
   Files: `tests/factories/sessions.ts`, `tests/factories/gps.ts`, `tests/factories/records.ts`, `tests/factories/profiles.ts`, plus every spec importing from them
   Change: rename each exported factory to `createMock<Entity>` (`makeSession` becomes `createMockTrainingSession`, and so on for the GPS, record and profile factories), give each a single optional `overrides` parameter typed `Partial<Entity>`, return `Entity`, and spread `overrides` last so every default is replaceable (R2). Update every importer.
   Check: `grep -rn "makeSession\|makeLaps" tests src` returns nothing; `pnpm test -- --run`.

2. Make each factory's defaults a complete, valid instance.
   Files: the four factory modules
   Change: R3 — every required field of the entity is populated, so the return value type-checks as the entity itself and not as a partial. Annotate each factory's return type with the entity type rather than letting it be inferred; the annotation is what makes a missing field a compile error when the entity grows.
   Check: `pnpm check`; adding a required field to `TrainingSession` fails in the factory and nowhere else.

3. Compose nested entities through their own factories.
   Files: the four factory modules
   Change: R4 — a factory for an entity containing another entity calls that entity's factory for the nested value rather than inlining its shape, and accepts an override for it. A session containing GPS or lap data calls the GPS and lap factories.
   Check: `grep -n "createMock" tests/factories/sessions.ts` shows calls to the sibling factories; `pnpm test -- --run`.

4. Replace the remaining entity literals in specs.
   Files: every spec the R1 signal reports
   Change: R1 — a spec never constructs a persisted or schema-defined entity as an object literal; it calls the entity's factory and passes only the fields the test depends on. This overlaps with the mock-proxy plan's item 2: a *data* entity the unit merely reads goes through a factory here, while a *collaborator* the unit talks to goes through a mock proxy there. Decide per site which it is.
   Check: R1's signal reports nothing; `pnpm test -- --run`.

5. Keep factory modules importable from specs only, and holding only factories.
   Files: `tests/factories/*`, all of `src/`
   Change: R6 — no production module imports a factory module. R7 — every export of a factory module is a factory following R2's name shape; fixture constants, sample payloads and other scaffolding move to their own sibling module under `tests/`. R8 — a factory's defaults are fixed values, and where a generated id or timestamp is genuinely needed the factory generates it and any spec asserting on that field reads it back from the returned instance rather than hard-coding an expectation.
   Check: `grep -rn "@tests/factories" src` returns nothing; `pnpm check && pnpm test -- --run`.

## Open items

`src/lib/factories/records.ts` is **production** code, not a test factory, despite the directory name. R5's rule about where a factory lives applies only to `tests/factories/`; this plan does not touch `src/lib/factories/`. The name collision is confusing and worth renaming one day, but that is a separate change and not this record's business.

R5's workspace-package clause is Moot: PaceVault is a single package with no `./testing` subpath export, so every factory lives in `tests/factories/` and there is no published factory to compose.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
