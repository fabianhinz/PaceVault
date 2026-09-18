---
kind: pattern-apply-tdr-reference
id: hook-results-bound-whole
title: Bind a hook's result whole and read through the name
summary: A hook call's return value is bound to one named const and its members read through that name, so a read three screens down still says where the value came from.
governs:
  - "src/**/*.ts"
  - "src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5]
adopted: 2026-09-17
---

# Bind a hook's result whole and read through the name

## 1. Context

This file carries R1–R5.

This is a call-site record. Whatever shape a hook chooses to return, the caller binds that return value to one named `const` and reads its members through that name — `const tracks = useMapTracks(...)` and then `tracks.paths`. The value is not taken apart in the binding and its members are certainly not renamed on the way out, so a reader three screens below the binding still knows where `tracks.paths` came from without scrolling back. A destructured binding throws that provenance away at exactly the moment it is cheapest to keep: `paths` alone names an array and nothing else, and once two hooks are in scope their loose members start colliding and get renamed to survive, which is how a call site ends up with identifiers that name neither their source nor their meaning.

This sits directly on top of the project's own standing rule against destructuring hook return values, and states the naming half that rule leaves open. What a hook *returns* is a separate record.

Reads from a Zustand store are excluded: `useSessionsStore((s) => s.sessions)` already selects the narrowest value, and the selector's result is the value, not a bag to unpack.

Specs deliberately do the opposite where a render helper's queries are concerned; `tests/**` is exempt in every detection entry below.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Bind a hook call's return value to a single named `const` and read its members through that name. Do not destructure the result in the binding. | proposed |
| R2 | Name the const for the thing returned, not for the hook that produced it. The name is what carries provenance to every read below it, so it must read as a noun a reader can follow (`weather`, `selectedTrip`, `estimate`), never a stand-in like `result`, `data` or `value`. | proposed |
| R3 | Never rename a member on the way out of a binding. Two results that would collide are disambiguated by their two const names, which is the collision already solved. | manual |
| R4 | Where a call site needs exactly one member exactly once, reading it directly off the call — `useSomething().member` — is an accepted alternative to a named const. Anything read twice, or read far from its binding, gets the named const. | manual |
| R5 | Carve-out: a third-party hook whose return is a fixed positional pair or a bag of independently-usable callables that no noun names may be destructured, taking only the members the site uses and renaming none of them. `useSearchParams`, `useTransition` and `useState` qualify. A hook declared in this codebase never does — give it a return shape worth naming instead. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "const \\{[^}]+\\} = use[A-Z][A-Za-z0-9]*\\(|const \\[[^\\]]+\\] = use[A-Z][A-Za-z0-9]*\\("
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["tests/**", "src/paraglide/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Matches `useState`, `useTransition` and `useSearchParams`, all of which are R5 carve-outs.
    Read the hook's origin before treating a match as a violation.
R2:
  type: grep
  pattern: "const (result|data|value|res|obj|item) = use[A-Z][A-Za-z0-9]*\\("
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["tests/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Misses a stand-in name this list does not enumerate; the list is a smell test, not a closed
    vocabulary.
R3:
  type: grep
  pattern: "const \\{[^}]*:[^}]*\\} = use[A-Z]"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["tests/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A destructuring pattern containing a type annotation rather than a rename also matches.
R4:
  type: manual
  reason: >
    Counting how often a member is read, and how far from its binding, is a per-call-site reading.
  enforcedBy: null
R5:
  type: manual
  reason: >
    Deciding whether a hook is third-party and whether its members are independently usable means
    resolving the import, not matching the line.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** every read carries its own provenance, so a reader far below the binding never has to scroll back to learn what `paths` is.
- **Good, because** two hooks in scope cannot collide, so nothing gets renamed defensively and identifiers keep meaning what they say.
- **Bad, because** it is more verbose at every use — `tracks.paths` where `paths` would have done — and in a component that reads one member many times, that repetition is real noise.
- **Neutral, because** the R5 carve-out means the codebase contains both forms, and which one applies depends on where the hook came from rather than on how the line looks.

## 5. Reference implementation

```ts
const weather = useSessionWeather(session);
const tracks = useMapTracks(gpsData);

if (weather.isLoading) return <ValueSkeleton />;
return <WeatherChips temperature={weather.data.temperature} paths={tracks.paths} />;
```

The carve-out, unchanged and correct:

```ts
const [searchParams, setSearchParams] = useSearchParams();
```

## 6. Forbidden practices

- ❌ `const { paths, bounds } = useMapTracks(...)` — the members lose their source at the moment it was free to keep.
- ❌ `const result = useCoachPlan(...)` — `result` names nothing; every read below it says less than it could.
- ❌ `const { data: weather } = useSessionWeather(...)` — renaming on the way out replaces the provenance the const name was supposed to carry.
- ❌ Destructuring a hook declared in this codebase on the grounds that its return is "just a bag" — if it is, the hook's return shape is the thing to fix.
