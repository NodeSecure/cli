# AGENTS.md

## Project Overview

NodeSecure is a Node.js security CLI that statically analyzes a package's dependency tree (AST scanning, registry metadata, license/vulnerability checks) and renders results as an interactive dependency graph. This is the npm workspaces monorepo hosting the CLI and its supporting packages, each under `workspaces/`: `cli`, `server`, `cache`, `size-satisfies`, `documentation-ui`, `vis-network`.

## Essential commands

Run from the repo root:

- `npm run build` — build all workspaces (`--ws --if-present`)
- `npm run lint` / `npm run lint-fix` — ESLint across all workspaces
- `npm test` — lint, then test all workspaces

Per workspace (`npm run <script> -w workspaces/<name>`), most expose `build`, `lint`, `test`. `cli` additionally has:

- `npm run dev -w workspaces/cli` — esbuild dev/watch build
- `npm run test:e2e -w workspaces/cli` — Playwright e2e (see Landmines re: browser install)

## Conventions

- **Native type stripping (Node >=24), no build step for tests/dev.** `src/**/*.ts` and `test/**/*.ts` run directly — no `ts-node`/`tsx`/watch-compile. Relative imports need an explicit `.ts` extension (never `.js`). The shared `tsconfig.base.json` (`@openally/config.typescript/esm-ts-next`) enforces `erasableSyntaxOnly` (no `enum`, no constructor parameter properties, no `namespace`/`module`) and `verbatimModuleSyntax` (type-only imports must use `import type`); `noImplicitAny` is deliberately off while the rest of `strict` is on.
- `.npmrc` sets `ignore-scripts=true` and `package-lock=false`: a plain `npm install` won't run lifecycle scripts or write a lockfile. CI mirrors this (`npm install --ignore-scripts`).
- Only one ESLint config exists, at the root (`eslint.config.mjs`), covering every workspace. `workspaces/cli`'s own `lint` script is **not** ESLint — it's `stylelint` for CSS/public JS only. Lint `cli`'s JS/TS via the root `npm run lint`, not `-w workspaces/cli`.
- The root `tsconfig.json` project references exclude `workspaces/cli` (it builds via esbuild, not `tsc`) — type-check it from inside `workspaces/cli` itself.
- `cli`'s e2e suite (`test:e2e`, Playwright) needs `npx playwright install --with-deps` first and only runs on Ubuntu in CI.
- Each workspace has its own GitHub Actions workflow (`.github/workflows/<name>.yml`) gated by a `paths:` filter.
- Publishing/versioning uses Changesets (`.changeset/`); add one via `npx changeset add` for user-facing changes.
