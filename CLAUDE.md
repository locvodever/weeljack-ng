# WeeljackNg — engineering rules

The repo-level contract every executor reads before its first line.

## 1. About

**What this is.** WeeljackNg (`weeljack-ng`, prefix `wj`) is Loc's own Angular UI library: a
design-system layer over OpenNG's Optimus UI (`@openng/optimus-ui`, the MIT fork of PrimeNG v21), for
any app, not one app. **"WeeljackNg" / `weeljack-ng` has no "h" on purpose — never "fix" it.**

**Decisions.** `docs/adr/` is **required reading** before you change the Optimus boundary (0001), a
wrapper's API (0002), the theme contract (0003), the package layout (0004), versioning (0005), the
Optimus-lag policy (0006) or the licence (0007). Planning history lives on the effort map in Loc's
Second Brain (`SecondBrain/projects/weeljack-ng/efforts/weeljack-ng-library/map.md`). A number in
parentheses below is a ticket there (`questions/NN-*.md`), and nothing here is re-decided in code.

**Vocabulary.**
- **wrapper** — a `wj-*` component or `wj` attribute directive over one Optimus entry.
- **entry** — one secondary entry point, `weeljack-ng/<entry>`, named after the Optimus entry it
  wraps.
- **own component** — WeeljackNg's own composite, not a wrapper (`wj-sheet`, `wj-field`).
- **slot** — a typed `wj<Component><Slot>` template directive.
- **`pt`** — the pass-through escape hatch, which tracks Optimus.
- **wave** — a group of entries released together as one minor.

## 2. Stack and pins (12)

- `@angular/*` (with `cdk`, `build`, `cli`) and `ng-packagr` at `~22.2.6` as devDependencies. Moving
  to 22.3 is a deliberate bump that raises the peer floor in the same commit.
- Published peers: `@angular/*` `^22.2.0`, only the packages the published code imports (`rxjs`
  `^7.8.1` if peered). Optimus peers are in § 4.
- TypeScript `~6.0.3`, with no TypeScript peer.
- Vitest `^5.1.0` through `@angular/build:unit-test`.
- Node:
  - `.nvmrc` is `26`, used by CI and the release build;
  - root `engines` is `^24.15.0 || ^26.0.0`, with `engine-strict=true`;
  - the published library manifest has **no** `engines`.
- Executor: `@quick-angular-dev`.

## 3. Layout and entry points (13, 01)

One repo, an Angular CLI multi-project workspace on npm, with one root `package.json`
(`private: true`) and one committed `package-lock.json`. No Nx, and no npm or pnpm workspaces.

```
projects/weeljack-ng/          library (sourceRoot)
  src/                         root entry `weeljack-ng`: provideWeeljack, theme, shared public symbols
  private/                     `weeljack-ng/private` — _-prefixed, @docs-private, outside semver
  <entry>/                     one per wrapped Optimus entry (button, select, toggleswitch, …)
    ng-package.json            {"lib":{"entryFile":"public-api.ts"}}
    public-api.ts, <entry>.ts/.html/.css/.spec.ts, <entry>-<what>.ts (slots, types)
    <stem>/                    a family part's own subfolder (e.g. a column beside the table)
    testing/                   `weeljack-ng/<entry>/testing` — Wj<Name>Harness
  sheet/, field/, locale/      own entries
projects/docs/                 the docs app (static prerender)
scripts/                       build, check and dev scripts
docs/adr/                      architecture decisions
```

**Naming.** The wrapper selector is Optimus's first selector with `p-` → `wj-` (`wj-toggleswitch`)
or `p` → `wj` (`input[wjInputText]`). The class is `Wj` + Optimus's class name. Folder, file,
selector suffix, docs slug and size row all share one word.

**Imports.**
- Component entries import the root and `private`; the root imports `private`; `testing` imports
  its own entry.
- Imports across entries use the package name, never a relative path.
- The root never exports a component and never re-exports another entry.

**Resolution (tsconfig `paths`, never `node_modules`).**
- The library's `tsconfig.lib.json` maps `weeljack-ng` / `weeljack-ng/*` to source.
- The docs app maps them to `./dist/weeljack-ng`, so it compiles against what npm ships.
- The root tsconfig carries the shared compiler options and no `paths`.

`LICENSE`, `THIRD-PARTY-NOTICES.md` and `README.md` live once, at the root.
`npm run build` copies them into `dist/weeljack-ng/` through `scripts/copy-package-files.mjs`.

## 4. The Optimus seam (09)

- **Where Optimus may appear:**
  - `@openng/*` is imported **only** inside `projects/weeljack-ng`. Lint bans it everywhere else,
    the docs app and its examples included.
  - `provideOptimus` is called **only** inside `provideWeeljack`, once.
  - Apps never call it, and `provideWeeljack` warns in dev mode when it is missing or when the
    theme lost the `wj` prefix after bootstrap.
- **Peers:** `@openng/optimus-ui` and `@openng/optimus-ui-themes` at one shared exact-minor range
  (`~2.0.2`). No `@openng/*` in `dependencies`, and `allowedNonPeerDependencies` stays at its
  default.
- **Types:** every type crossing a wrapper's interface is a `Wj*` type exported from that wrapper's
  entry. An input-direction type is a structural subset of the Optimus type it feeds, kept
  assignable by a type-level spec. Nothing from `@openng/optimus-ui/api` is re-exported.
- **Services:** an app-facing Optimus service gets a `providedIn: 'root'` `Wj*` service that ships
  with its component. An app never provides an Optimus service.
- **`pt`:** typed as `Wj<Name>Pt` and re-exported from the wrapper's entry, with the fixed JSDoc
  sentence marking it as tracking Optimus. `pt` part changes ship only in the release that takes a
  new Optimus minor, under their own changelog heading, and are not breaking.

## 5. Writing a wrapper (13, 02, 05, 21, 22)

**Conventions:**
- Standalone, with no `standalone: true` and no exported NgModule. A wrapper may import an Optimus
  NgModule into its own `imports` only.
- OnPush **by omission**. `Eager`/`Default` are banned.
- Zoneless-correct: no `zone.js`, no `NgZone.onStable`, `onMicrotaskEmpty` or `isStable`.
- APIs: only `input()`/`input.required()`/`model()`/`output()` and signal queries. Use `inject()`
  and `host: {}`; built-in control flow; `class`/`style` bindings.
- Browser globals only through `DOCUMENT`, `afterNextRender` or `isPlatformBrowser`.
- Plain CSS inside `@layer wj`; no Sass.
- Motion only through `animate.enter`/`animate.leave`, never `@angular/animations`. Pass Optimus
  motion `safe: true` on every animated part.

**API (02):**
- Expose by need, never mirror. The docs page carries the Optimus→WeeljackNg mapping table (kept,
  renamed, dropped).
- Always drop `dt`, `unstyled`, `ptOptions`, `style`/`styleClass`/`*Style*`, deprecated aliases and
  duplicate selectors.
- Outputs are camelCase and never `on`-prefixed. Use `size`, `variant` and `severity` with
  Optimus's values, and Angular's form-state names.
- A form control is its own CVA with a `value`/`checked` `model()`, and registers with an enclosing
  `wj-field`.
- ARIA inputs (`inputId`, `ariaLabel`, `ariaLabelledBy`, `ariaDescribedBy`) are routed to the
  focusable part, with a dev-mode warning for `aria-*` on a component host.

**Rendering safety (19):**
- Never `bypassSecurityTrust*`, `[innerHTML]`, `[outerHTML]`, `.innerHTML =`, `insertAdjacentHTML`,
  `document.write`, or an `escape` binding. App strings render only through `{{ }}`.
- Menu wrappers force `escape: true`, Tooltip and Message never expose `escape`, and ConfirmDialog
  always supplies its message template.
- No inline script or `eval`.

**Budget, SSR and errors (21):**
- A wrapper entry weighs at most the larger of 1.5 KB or 25% of the Optimus entry it wraps; an own
  entry at most 3.2 KB (esbuild minify + gzip-6, read from `size-budgets.json`). No PR raises a
  limit.
- SSR is claimed; hydration is not, in v1.
- Optimus errors are never caught or re-wrapped.
- Own errors follow `WJ<NNNN>: <wj-selector>: <what is wrong>. <what to do>. Find more at
  <docs>/errors/WJ<NNNN>`, behind `ngDevMode`.

**Theme (05, 22):**
- `provideWeeljack({ primary, surface, darkMode, translation })`, read once.
- Public `--wj-*` variables, one `@layer wj`.
- The default look is "Noir on zinc", with 44 px controls and hit boxes of at least 24 × 24 px.
- UI-chrome labels come from the translation.

## 6. Commands and definition of done (16, 17)

| Command | What it does |
|---|---|
| `npm run setup` | Main checkout only: refuses inside a worktree, then `npm ci` + `npx playwright install chromium` (or set `CHROME_BIN` to system Chrome) |
| `npm start` | `scripts/dev.mjs`: library watch build, then `ng serve docs` on 4200 (`PORT` overrides), full reload on library edits |
| `npm run test:watch` / `test:debug` | Headless watch / headed Chromium with the Vitest UI. Focus with `-- --include=<entry>/**` |
| `npm run check` | **The gate**, failing fast: lint → typecheck → build → `check:contrast` → test → `build:docs` → `check:ssr` → `check:a11y` → size → `check:pack` → `check:licences` |
| `npm run lint` / `format` | `eslint . --max-warnings 0 && prettier --check .` / `prettier --write .` |
| `npm run pack:local` | Build and pack a tarball for a consumer trial: `npm install --no-save <tgz>` in the app, reverted by `npm install`, never merged |

**Executors:**
- Iterate with focused `npx ng test --include=<entry>/**` runs, then run `npm run check` **once**
  at the end.
- In a worktree, never run `npm ci`, `npm install` or `setup`.
- Local Node is the host's 24.x; never `nvm use` 26.
- Stop `npm start` before `build`/`check` in the same checkout.

**Specs:**
- Vitest 5 in real headless Chromium; no jsdom.
- A host template renders the wrapper against real Optimus through its harness. No stubs, no
  `NO_ERRORS_SCHEMA`, and no reads of private members.
- Fake time only via `vi.useFakeTimers()` with the `// spec-timing:` marker.
- axe in every component spec.

**Per-wrapper definition of done** (every wrapper and own component):
1. A spec proves every API criterion: inputs and outputs, `pt`, the forms trio
   (`ngModel`/`FormControl`/`[formField]`), slots, ARIA routing, and an HTML payload on every
   string input rendered as text.
2. The harness is exported and used.
3. Zero axe violations in every documented state, light and dark, plus a keyboard spec. Before the
   wave's release, a keyboard walk plus NVDA + Chrome (VoiceOver iOS for overlays) is recorded on
   the docs page.
4. A docs page (purpose and import → examples → Accessibility → Styling → generated API) that
   prerenders, never with `RenderMode.Client`.
5. A size row within budget.
6. OnPush and zoneless.
7. `npm run check` exits 0.

## 7. Lint and format (13)

ESLint 10 flat config:
- `typescript-eslint` `strictTypeChecked` + `stylisticTypeChecked`; angular-eslint
  `tsRecommended`, `templateRecommended`, `templateAccessibility`; `eslint-config-prettier` last;
  `--max-warnings 0`.
- Added rules:
  - `wj` element/attribute selectors (`docs` in the docs app);
  - `prefer-on-push-component-change-detection` with `allowExplicitOnPush: false`;
  - `prefer-signals`, `prefer-output-emitter-ref`, `prefer-host-metadata-property`;
  - `Wj`-prefixed exported types and `_`-prefixed `private/` exports;
  - `no-restricted-imports` for `@openng/*` outside the library, for `zone.js`, and in specs for
    `fakeAsync`, `waitForAsync`, `tick`, `flush` and the two schemas;
  - `no-restricted-properties` on the zone stability APIs;
  - 19's rendering-sink ban.
- Restrictions are **data**, composed into **one** `no-restricted-imports` entry per region,
  because flat config keeps only the last matching options.

Prettier 3: `printWidth 100`, `singleQuote`, `trailingComma all`, `endOfLine lf`, and the `angular`
parser for `*.html`. All Markdown is ignored. `.gitattributes` pins `eol=lf`.

## 8. Copied code and licence (08)

- A file copied or adapted from Optimus opens with this header:
  - `SPDX-License-Identifier: MIT`;
  - `Adapted from @openng/<package> <version>, <source path>`;
  - the source's copyright lines, verbatim;
  - `Modifications Copyright (c) <year> Loc Vo`.
  A third-party header already in the source stays verbatim above it.
- `THIRD-PARTY-NOTICES.md` lists, per upstream package, the full MIT text with its copyright lines
  and the WeeljackNg files adapted from it. Third-party text never goes into `LICENSE`.
- A file that only imports, wraps or configures Optimus is not a copy.
- **Copy only from Optimus or PrimeNG v21 and earlier. Never from PrimeNG v22+** (proprietary).

## 9. Branches, commits, releases (14, 20)

- **Branches and merges:**
  - Trunk on `main`, with short-lived `feat/`, `fix/` and `chore/<slug>` branches.
  - Squash merge only. The PR title is the Conventional Commit subject (`feat(weeljack-ng): …`;
    `!` or `BREAKING CHANGE:` marks a break).
- **release-please** owns `CHANGELOG.md` and the version; never hand-edit either.
  - A release is the merge of its release PR.
  - Each wave closes with `Release-As: 0.N.0` (wave 1 = `0.1.0`), and a breaking `wj-*` change
    ships only at a wave close.
  - `1.0.0` closes the overlays wave. After it, an input or output is removed only after one
    `@deprecated` minor.
- **Rollback of a bad `X.Y.Z`** is Loc's, by hand, within 10 minutes of deciding:
  1. `npm deprecate weeljack-ng@X.Y.Z "<why> — use <good>"`.
  2. `npm dist-tag add weeljack-ng@<previous good> latest`. Each command prompts for his security
     key.
  3. `docs.yml` redeploys the previous tag.
  4. Fix forward: a revert or fix PR, then a release-please patch, then a CI publish, which moves
     `latest` back up.

  Never unpublish, except within 72 h for a leaked secret or malicious content; the version number
  is burned either way. CI gets no dist-tag right: "Allow npm dist-tag" stays off.
- **Agents never run `npm deprecate`, `npm dist-tag`, `npm unpublish` or `npm publish`.**

## 10. Dependencies (18)

- Dependabot runs weekly (Monday) in three groups: `angular` (`@angular/*`, `angular-eslint`,
  `ng-packagr`, `@openng/*`), `tooling`, and `github-actions`. It ignores majors of `@angular/*`,
  `@openng/*` and `@types/node`, and any TypeScript outside `@angular/compiler-cli`'s range.
- A new Optimus **minor** is a deliberate certification:
  1. Read its release notes and open issues.
  2. Run the full suite and the docs app, with a human pass over the docs app.
  3. Widen the peer range in a release.
- The licence allow-list on what ships: MIT, Apache-2.0, BSD-2/3-Clause, ISC, 0BSD
  (`check:licences`).
- Committed lockfile, frozen `npm ci`, `engine-strict`.
- If Angular 23 ships before Optimus supports it, stay on 22 (ADR 0006).

## 11. Disciplines every executor follows

The Second Brain contracts, at `E:/Projects/second-brain/.claude/docs/`:
- `type-discipline.md` — no `any` or `@ts-ignore` escapes without a `// type-escape:` marker.
- `motion-discipline.md`.
- `spec-timing-discipline.md` — `vi.useFakeTimers()` lines carry `// spec-timing:`.
- `test-run-discipline.md`.
- `component-folder-discipline.md`.
- `angular-hygiene-discipline.md`.
- `ci-wait.md`.

## 12. Engineering baseline

Copied from the roadmap's engineering baseline (one line per area that applies).

- **B01 Stack and version pins:**
  - `@angular/*` (with `cdk`, `build`, `cli`) and `ng-packagr` `~22.2.6` as devDependencies, so
    22.3 is a deliberate bump;
  - `@angular/*` peers `^22.2.0` (`rxjs` `^7.8.1` if peered);
  - TypeScript `~6.0.3` and no TypeScript peer;
  - `.nvmrc` `26` for CI and the release build; root `engines` `^24.15.0 || ^26.0.0` with
    `engine-strict=true`; no `engines` in the published manifest;
  - Vitest `^5.1.0` via `@angular/build:unit-test`;
  - executor `quick-angular-dev`.
  - Sources: ticket 12, facts in ticket 11.
- **B02 Repo layout and conventions:**
  - one repo, an Angular CLI workspace on npm: library `projects/weeljack-ng` and docs app
    `projects/docs`;
  - tsconfig `paths` (docs → `dist`, library → source), never npm/pnpm workspaces or Nx;
  - flat entry folders named after the Optimus entry, with `<entry>/testing` for harnesses and
    cross-entry imports by package name;
  - 13 Q5's conventions;
  - ESLint 10 flat config with the `wj` selector, OnPush-only, `Wj` naming and `@openng/*`/zone.js
    and spec bans, plus Prettier 3 with Markdown ignored;
  - `CLAUDE.md` per 13 Q8's outline.
  - Source: ticket 13.
- **B03 Source control and release:**
  - public `locvodever/weeljack-ng`, trunk on `main`;
  - squash only, with the PR title as a Conventional Commit, branches deleted on merge;
  - a `main` ruleset (PR, `check` and `pr-title` required, no force-push or deletion, no approval)
    and a `v*` tag ruleset;
  - WeeljackNg's own semver, with a WeeljackNg → Angular → Optimus table;
  - a release is the merge of release-please's PR (`release-type: node`, both pre-major flags,
    `CHANGELOG.md` at the root);
  - `0.0.x` skeleton, each wave the next minor via `Release-As`, `1.0.0` after the overlays wave,
    the long tail as 1.x minors.
  - Source: ticket 14.
- **B04 Decision log:** the effort map keeps every planning decision. The repo's `docs/adr/` holds
  the seven ADRs below, committed in the seed commit. A new ADR only when hard to reverse, surprising and a real trade-off, in the PR that makes the change; an accepted ADR is superseded, never rewritten.
  - Source: ticket 15.
- **B05 Testing and definition of done:**
  - Vitest 5 in headless Chromium (browser mode, no jsdom), `restoreMocks`;
  - host-template specs against real Optimus through the harness, never private members;
  - fake time only via `vi.useFakeTimers()` with the `// spec-timing:` marker;
  - axe in every component spec, light and dark;
  - strict TypeScript plus `strictTemplates` and `extendedDiagnostics` as errors;
  - no pixel-diff suite in v1;
  - the 7-point per-wrapper definition of done;
  - `npm run check` (lint → typecheck → build → `check:contrast` → test → `build:docs` →
    `check:ssr` → `check:a11y` → size → `check:pack` → `check:licences`) is the gate, run once at
    the end after focused `npx ng test --include=<entry>/**` runs.
  - Sources: ticket 16, ticket 20.
- **B06 Local dev experience:**
  - `npm run setup` once, in the main checkout only (`npm ci` + Playwright Chromium, `CHROME_BIN`
    fallback);
  - `npm start` (library watch + docs on 4200, `PORT` override);
  - `npm run test:watch` / `test:debug` (focus with `-- --include=<entry>/**`);
  - `npm run check` as the gate;
  - consumer trials via `npm run pack:local`, then `npm install --no-save <tgz>` in the app,
    reverted by `npm install`, never merged;
  - local Node is the host's 24.x; never `nvm use` 26;
  - in a worktree, never `npm ci`, `npm install` or `setup`.
  - Source: ticket 17.
- **B08 Dependency policy:**
  - Dependabot weekly in two groups (`angular`, `tooling`) plus `github-actions`, ignoring majors of
    `@angular/*`, `@openng/*` and `@types/node`, and any out-of-range TypeScript;
  - Optimus as exact-minor peers, each minor certified;
  - a permissive licence allow-list (MIT, Apache-2.0, BSD-2/3-Clause, ISC, 0BSD) on the shipped
    closure;
  - a committed lockfile, frozen `npm ci`, `engine-strict`;
  - on Angular 23 before Optimus, wait on 22 with a canary and a dated tripwire.
  - Source: ticket 18.
- **B09 Security baseline:**
  - no ASVS level (a library; each app picks its own);
  - npm 2FA with a security key;
  - `0.0.1` hand-published once, then OIDC trusted publishing with provenance, no npm token, and
    "Require 2FA and disallow tokens";
  - hardened Actions (`contents: read`, `id-token: write` on publish only, SHA pins, no
    `pull_request_target`);
  - audit warn-only on PRs, blocking with `npm audit signatures` at release;
  - wrappers never bypass the sanitizer or write app strings as HTML, enforced by lint plus an
    HTML-payload spec.
  - Source: ticket 19.
- **B12 Path to production:**
  - GitHub Actions on Ubuntu, with Node from `.nvmrc`;
  - required checks `check` (`npm run check`) and `pr-title`;
  - one `release.yml` on `main`: release-please → build → a no-code publish job via trusted
    publishing → docs deploy to `https://locvodever.github.io/weeljack-ng/`;
  - the release PR's workflows approved by hand;
  - no secret anywhere;
  - rollback per § 9.
  - Source: ticket 20.
- **B14 NFRs and failure modes:**
  - each wrapper entry ≤ max(1.5 KB, 25% of the Optimus entry it wraps), and own entries ≤ 3.2 KB,
    esbuild + gzip-6; no PR raises a limit;
  - no app-level budget;
  - OnPush and zoneless as hard rules;
  - SSR claimed, hydration not in v1;
  - Angular's default browsers;
  - Optimus errors never swallowed; own errors `WJ<NNNN>` behind `ngDevMode`.
  - Source: ticket 21.
- **B16 UI system:**
  - default look "Noir on zinc" (ink primary, zinc surfaces), with AA corrections over Aura and one
    2 px focus ring;
  - radius 8/12/6 px, 44 px controls, ≥ 24 px hit boxes, the app's font;
  - WCAG 2.2 AA via a contrast gate, axe `wcag22aa` with `target-size`, a keyboard + NVDA pass
    (VoiceOver iOS for overlays) and a dev-mode brand warning;
  - reduced motion by default;
  - locale via `provideWeeljack({ translation })` plus `weeljack-ng/locale` (en, vi).
  - Sources: ticket 22, ticket 05.
- **B17 Walking skeleton:** P0 → T0 → G-T0a (`0.0.1` by hand) → T0b → G-T0 (`0.0.2` via OIDC with
  provenance). Wave 1 builds after G-T0a and releases after G-T0.
  - Source: ticket 23.
- **B18 App flow:** the docs app's page map: Home → Get started → Components → `/components/<entry>`,
  plus Theming, Styling, Coming from Optimus and Changelog, with not-found, empty, error and offline
  exits.
  - Source: ticket 07.

**Not applicable:**
- B07: no runtime config, and no secret at all (20 Q5).
- B10: no persistent state.
- B11: no network boundary; the TypeScript API is 02 and 09.
- B13: no running service.
- B15: no PII and no paid hosting.

