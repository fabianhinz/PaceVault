# Known-flaky tests

One line per test. A failing test listed here is re-run with `vp exec playwright test --last-failed --workers 1`; a failure not listed here is new and goes into the review doc. Only the owner removes entries.

- `e2e/mobile/map.spec.ts:480` · fails under parallel load, passes with `--workers 1` · first seen 2026-10-17
- `e2e/mobile/map.spec.ts:281` · fails under parallel load, passes with `--workers 1` · first seen 2026-10-17
- `e2e/intervals.spec.ts:47` · fails under parallel load, passes with `--workers 1` · first seen 2026-10-17
- `e2e/sessions.spec.ts:255` · failed once under parallel load, passed with `--last-failed --workers 1` · first seen 2026-10-18
- `e2e/sessions.spec.ts:309` · failed once under parallel load, passed with `--last-failed --workers 1` · first seen 2026-10-18
- `e2e/studio.spec.ts:140` · failed once under parallel load, passed with `--last-failed --workers 1` · first seen 2026-10-18
