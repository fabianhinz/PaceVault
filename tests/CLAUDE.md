# Testing Strategy

- **Goal**: Protect behaviour the user would notice breaking — wrong numbers, lost/duplicated/leaked data, a broken flow. Not coverage. A change usually needs 0–3 new tests.
- **Always test**:
  - persist `migrate` functions, including legacy and unrecognised shapes (data must survive)
  - Zod `safeParse` fallbacks for file, API and IndexedDB input (fallback, never throw)
  - dedup/merge when importing activities
  - secrets never reaching URLs, logs or storage
  - a regression test for every bug fix, named after the bug
- **Test when**: the logic branches, does arithmetic, or transforms data. Cover the happy path plus edge cases you can point to in a real FIT file, API response or bug report — not hypothetical inputs.
- **Skip**: trivial helpers, thin wrappers, pass-through mappings, React components (no render tests), and exact request shapes unless they carry a security property.
- **Level**: Prefer the lowest level that exercises the behaviour. `src/packages/engine/`, `src/packages/*/` and `src/lib/` get unit tests. Use integration (`*.integration.test.ts`) only when the behaviour is the wiring (e.g. import → engine → store) — one test per flow, plus one for a failure the user sees. Never repeat a case at a second level.
- **E2E**: Only core user journeys. Extend an existing spec before adding a new file.
- **Style**: Assert outcomes (values, persisted state, visible text), not call counts, internal structure or snapshots.
- **Existing tests**: Don't add tests to files you didn't otherwise touch. If a test fails because behaviour changed on purpose, update or delete it — don't add a sibling.
- **Naming**: Files live in `tests/` as `*.spec.ts` or `*.integration.test.ts`.
