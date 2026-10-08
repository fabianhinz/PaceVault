# Research prompt template

Fill every `{placeholder}`, delete the sections that do not apply to this topic, and send the result as the subagent's prompt. One prompt per independent topic.

```markdown
You are researching UI options for PaceVault, a local-first PWA (React 19, Radix + Tailwind, dark mode only) that maps and analyses fitness activities from .FIT files. The app owner decides; your job is to inform that decision, not to make it.

## Topic

{one sentence: what the owner wants to explore}

## Current state

{3–8 lines from step 1, with path:line references}

## Constraints

- Dark mode only. Map colours follow CLAUDE.md §6: no blue, cyan, teal or grey on the map; running is #4ade80, cycling #f97316.
- 0 is data: a recorded 0 shows `0`, missing data shows `--`.
- Labels must fit in English and German.
- Data available per session: {fields and their resolution, e.g. records at the device interval (1 s, or 1–8 s with smart recording) for HR, power, speed, cadence, altitude; laps; weather per full hour}
- {further constraints from the owner}

## Your work

Read the repo as needed, and change nothing in it: no file writes, no git commands, no dev servers.

1. **Comparable products**: how {products to look at, e.g. Strava, Garmin Connect, intervals.icu, TrainingPeaks, Komoot} solve this. Give a source link for every claim, and mark anything you could not verify from a source as "unverified".
2. **Generic UI patterns** that fit the topic. Judge each one on: data availability in PaceVault, fit on a 390 px phone, vertical space used, glanceability, implementation effort, risks.
3. **Shortlist**: 4–6 variants, each with an ASCII sketch for desktop and for 390 px, and a one-line rationale.
4. **Open questions** the owner has to answer before a variant can be chosen, each with the options you see.

## Report

Return a concise report in exactly this order: comparable products, patterns table, shortlist with sketches, open questions, sources. No recommendation on the owner's behalf beyond marking which variant you would test first and why.
```
