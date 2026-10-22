# Known-flaky tests

One line per test. A failing test listed here is re-run from the root with `vp -C apps/web exec playwright test --last-failed --workers 1` (the paths below are relative to `apps/web`); a failure not listed here is new and goes into the review doc. Only the owner removes entries.
