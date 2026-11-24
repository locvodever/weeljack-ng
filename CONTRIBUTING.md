# Contributing to WeeljackNg

Thanks for helping. WeeljackNg is a small library with one maintainer, so a few house rules keep reviews quick.
`CLAUDE.md` is the full engineering contract; this page is the part a contributor needs. The name is spelled without
an "h" on purpose.

## Before you write code

- **Bugs.** Open an issue with:
  - the WeeljackNg, Angular and Optimus UI versions;
  - the smallest template that shows the problem;
  - what you expected and what happened.

  A StackBlitz or a small repo helps a lot.
- **Features, inputs or a new wrapper.** Open an issue first and wait for a yes. Each wrapper's API is designed on
  purpose rather than mirrored from Optimus ([ADR 0002](docs/adr/0002-own-api-for-every-wrapper.md)), so an
  unannounced PR that copies Optimus's inputs will likely be asked to change.
- **Security problems.** Don't put the details in a public issue. Open an issue titled "Security contact" with no
  details, and the maintainer will reach you privately.
- **Decisions.** Read [`docs/adr/`](docs/adr/) before you change any of these:

  | Area | ADR |
  |---|---|
  | The Optimus boundary | 0001 |
  | A wrapper's API | 0002 |
  | The theme contract | 0003 |
  | The package layout | 0004 |
  | Versioning | 0005 |
  | The Optimus-lag policy | 0006 |
  | The licence | 0007 |
  | The icon set | 0008 |
  | Runtime colour switching | 0009 |
  | Base presets | 0010 |

## Set up

- Node `^24.15.0` or `^26.0.0`. `.nvmrc` is `26`, and `engine-strict` is on.
- Fork and clone, then run `npm run setup` once. It runs `npm ci` and installs Playwright's Chromium. Set
  `CHROME_BIN` to use a system Chrome instead.
- `npm start` builds the library in watch mode and serves the docs on `http://localhost:4200`.
- While you work, run focused specs: `npx ng test --include=<entry>/**`. For watch mode, use
  `npm run test:watch -- --include=<entry>/**`.
- Before you open a PR, stop `npm start` (both write `dist/`), then run **`npm run check` once**. It is the gate,
  and it fails fast:

  lint → typecheck → build → `check:contrast` → test → `build:docs` → `check:ssr` → `check:a11y` → `size` →
  `check:pack` → `check:licences`

  It takes about 25–30 minutes, because `check:a11y` runs axe over every docs page in light and dark, for every
  preset.

## Branches and pull requests

- Branch from **`dev`**: `feat/<slug>`, `fix/<slug>`, `docs/<slug>`, `ci/<slug>` or `chore/<slug>`.
- Open the PR **into `dev`**, never into `main`. `main` receives `dev` only when the maintainer promotes it for a
  release.
- The **PR title is a [Conventional Commit](https://www.conventionalcommits.org/) subject**, and the `pr-title` check
  enforces it. Examples:
  - `feat(weeljack-ng): wj-slider gains a range mode`
  - `fix(weeljack-ng): wj-select keeps focus after clear`
  - `docs: …`
  - `ci: …`
- PRs are squash-merged, so the title becomes the commit and the changelog line. Keep one change per PR.
- **Breaking changes:** mark them with `!` after the type, or with a `BREAKING CHANGE:` footer in the body. Before 1.0,
  a breaking `wj-*` change ships only in a wave-closing minor (`0.N.0`), with a migration note.
- The PR body says:
  - what changed and why;
  - how you tested it;
  - the `npm run check` result;
  - a size row if you needed one (see below).
- Don't edit `CHANGELOG.md`, the `version` in either `package.json`, `.release-please-manifest.json` or
  `release-please-config.json`: release-please owns them.

## Writing a wrapper

The full rules are `CLAUDE.md` §4 and §5. The ones reviews catch most often:

- **Angular style:**
  - standalone components with OnPush;
  - zoneless: no `zone.js`, and no `NgZone` stability APIs;
  - `input()`, `model()` and `output()`, `inject()`, `host: {}` and built-in control flow.
- **The Optimus seam:**
  - `@openng/*` is imported only inside `projects/weeljack-ng` (lint enforces this);
  - `provideOptimus` is called only by `provideWeeljack`;
  - every type a wrapper exposes is a `Wj*` type from its own entry.
- **API:**
  - expose inputs by need, never mirror Optimus;
  - outputs are camelCase with no `on` prefix;
  - ARIA inputs (`ariaLabel`, `ariaLabelledBy`, …) reach the focusable part;
  - the docs page's mapping table lists what was kept, renamed or dropped.
- **Rendering safety:**
  - no `[innerHTML]`, `bypassSecurityTrust*`, `insertAdjacentHTML`, `eval` or inline script;
  - app strings render only through `{{ }}`.
- **Styling:**
  - plain CSS inside `@layer wj`, on public `--wj-*` variables;
  - no Sass.
- **Motion:** only through `animate.enter` / `animate.leave`, and it respects `prefers-reduced-motion`. Never
  `@angular/animations`.
- **Shared helpers:** reuse the ones in `weeljack-ng/private` (`_mergePartAttributes`, `_wjId`, `_warnOnce`, …)
  rather than writing your own.
- **Dev-mode errors and warnings** use `WJ<NNNN>` codes from your family's block (`CLAUDE.md` §5).
- **Types:** no `any`, `as any` or `@ts-ignore`. The lint config is `strictTypeChecked`.

## Tests, accessibility and size

- **Specs:**
  - Vitest in real headless Chromium, with no jsdom;
  - a host template renders the wrapper against real Optimus, through its `testing/` harness;
  - no stubs, no `NO_ERRORS_SCHEMA`, and no `fakeAsync` or `tick` (lint bans them);
  - fake timers only where a spec truly needs them;
  - axe runs in every component spec.
- **Done for a wrapper:**
  - specs cover every input, output, slot and ARIA route, plus a keyboard spec;
  - the harness is exported;
  - there are zero axe violations in light and dark;
  - the docs page prerenders;
  - the size is within budget;
  - `npm run check` exits 0.
- **Accessibility:** WCAG 2.2 AA.
  - `check:contrast` measures the theme's colour pairs.
  - `check:a11y` runs axe on every docs page in light and dark, for every preset.
- **Size:** measured as esbuild minify plus gzip, printed by `npm run size`.
  - A wrapper entry may weigh the larger of 2.5 KB or 25% of the Optimus entry it wraps.
  - An own entry may weigh 5 KB.
  - The root (5 KB) and `weeljack-ng/private` (7 KB) never change.
  - A PR that doesn't fit says so instead of raising a limit. Only the maintainer raises a wrapper's limit: by the
    measured size plus at most 0.05 KB, capped at +0.25 KB.

## Adding an entry

A new entry touches only its own files (`CLAUDE.md` §6):

- `projects/weeljack-ng/<entry>/**`: `ng-package.json`, `public-api.ts`, the wrapper, its spec, and the `testing/`
  harness.
- `projects/docs/src/app/examples/<entry>/**`: the live examples.
- `projects/docs/src/app/pages/component/docs/<entry>.ts`: the page's `DOC`.
- A row in `projects/docs/coverage.json`, but only for a new **Optimus** entry point.

Never edit `projects/docs/src/generated/`. It is gitignored, and `npm run generate` writes it.

## Copied code and licence

- WeeljackNg is MIT. By contributing, you agree that your contribution is licensed under the MIT licence.
- **What you may copy:** Optimus UI, or PrimeNG **v21 and earlier**, both MIT. **Never copy from PrimeNG v22 or
  later**, which is proprietary.
- **How to mark a copied or adapted file:**
  - it opens with the SPDX header, the upstream package, version and path, the upstream copyright lines, and a
    `Modifications Copyright` line;
  - its upstream gets an entry in `THIRD-PARTY-NOTICES.md`.

  A file that only imports, wraps or configures Optimus is not a copy (`CLAUDE.md` §8).
- **Icons:** `icon-set.ts` is generated from the pinned `lucide` package and `icon/icon-set.json`. Never edit it by
  hand ([ADR 0008](docs/adr/0008-lucide-icon-set.md)).

## How releases work

Contributors don't need to do anything for a release.

1. The maintainer promotes `dev` to `main`.
2. release-please keeps a release PR on `main`, built from the squashed PR titles.
3. Merging that PR is the release. It tags `weeljack-ng-vX.Y.Z` and writes `CHANGELOG.md`.
4. CI then builds and runs the full gate, publishes to npm through trusted publishing (with provenance, and no tokens
   anywhere), and deploys the docs.

Before 1.0, each wave closes with the next minor ([ADR 0005](docs/adr/0005-versioning.md)).
