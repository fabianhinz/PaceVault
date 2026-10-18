# vite-plus upgrade: tech

## Data flow

```mermaid
flowchart LR
  lock[("pnpm-lock.yaml<br/>vite-plus 0.1.13 · vitest 4")] --> migrate["vp migrate (global 1.3.0)"]
  migrate --> pins["package.json · pnpm-workspace.yaml<br/>catalog · vite@* / vitest@* overrides · vitest 5"]
  migrate --> ci["ci.yml · deploy.yml<br/>setup-vp exact release"]
  migrate --> imports["135 test files<br/>vitest → vite-plus/test"]
  pin["written by hand: 24"] --> nv[(".node-version")]
  nv --> ci
  nv --> local["vp env (local Node)"]
```

## Modules

```mermaid
flowchart TB
  subgraph TOOL["toolchain"]
    pkg["package.json"]:::mod
    ws["pnpm-workspace.yaml"]:::mod
    vt["vitest.config.ts"]:::mod
    nv[".node-version"]:::new
  end
  subgraph CI["ci"]
    ci["ci.yml"]:::mod
    dep["deploy.yml"]:::mod
  end
  classDef new stroke:#60a5fa,stroke-width:1.5px
  classDef mod stroke:#8b8f9a,stroke-width:2px
```

### New

- `.node-version`: `24`, written by hand

### Changed

- `package.json`: `catalog:` references, vite-plus, vitest, coverage plugin
- `pnpm-workspace.yaml`: `vite@*` / `vitest@*` overrides, `catalog:` block
- `.gitignore`: `.vitest/`
- `tests/`: `vitest` imports rewritten to `vite-plus/test` (Q5)
- `tests/CLAUDE.md`: import convention
- `pnpm-lock.yaml`: refreshed
- `vitest.config.ts`: import from `vite-plus`, compatibility setting added then removed
- `.github/workflows/ci.yml`: setup-vp exact release, `node-version-file`
- `.github/workflows/deploy.yml`: same
- `CLAUDE.md`: tech stack row
- `README.md`: contributing (Node via vp)

## Interfaces

```yaml
# .github/workflows/ci.yml
- uses: voidzero-dev/setup-vp@v1.21.2
  with:
    node-version-file: .node-version
```
