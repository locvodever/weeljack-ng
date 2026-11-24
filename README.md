# WeeljackNg

[![npm](https://img.shields.io/npm/v/weeljack-ng)](https://www.npmjs.com/package/weeljack-ng)

An Angular UI library: a design-system layer over Optimus UI (`@openng/optimus-ui`) with its own
`wj-*` API and theme.

The name is spelled without an "h" on purpose.

Docs: <https://locvodever.github.io/weeljack-ng/>

## Install

```sh
npm install weeljack-ng @openng/optimus-ui@~2.0.2 @openng/optimus-ui-themes@~2.0.2
```

Then call `provideWeeljack()` in your app's providers. The docs'
[Get started](https://locvodever.github.io/weeljack-ng/getting-started) page walks through it.

## Compatibility

| WeeljackNg | Angular   | Optimus UI |
| ---------- | --------- | ---------- |
| `0.x`      | `^22.2.0` | `~2.0.2`   |

## Develop

Run `npm run setup` once, in the main checkout. Local Node is the host's 24.x (`.nvmrc` is `26`, for
CI and the release build).

| Command                           | What it does                                                                                                                                                                                       |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run setup`                   | `npm ci`, then `npx playwright install chromium`. Set `CHROME_BIN` to a system Chrome to run the specs without the download. Refuses in a worktree.                                                |
| `npm start`                       | Builds the library in watch mode, then serves the docs on `http://localhost:4200` (`PORT` overrides). A library edit rebuilds and reloads the page.                                                |
| `npm run test:watch`              | Headless watch run of the specs. Focus with `-- --include=<entry>/**`.                                                                                                                             |
| `npm run test:debug`              | The same in headed Chromium. Focus the same way.                                                                                                                                                   |
| `npm run check`                   | The gate, failing fast: lint, typecheck, build, `check:contrast`, test, `build:docs`, `check:ssr`, `check:a11y`, `size`, `check:pack`, `check:licences`.                                          |
| `npm run lint` / `npm run format` | ESLint and Prettier check / Prettier write.                                                                                                                                                        |
| `npm run pack:local`              | Builds and packs a tarball into `dist/` for a consumer trial: `npm install --no-save <tgz>` in the app, reverted by `npm install`, never merged.                                                   |

Rules:

- Iterate with focused `npx ng test --include=<entry>/**` runs, then run `npm run check` once at the
  end.
- Stop `npm start` before `npm run build` or `npm run check` in the same checkout: they write the
  same `dist/`.
- In a `/repo-*` worktree, never run `npm ci`, `npm install` or `npm run setup`.
- Read `CLAUDE.md` and `docs/adr/` before changing the Optimus boundary, a wrapper's API, the theme,
  the package layout, versioning or the licence.

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first: open PRs into
`dev`, title them as Conventional Commits, and run `npm run check` once before you ask for review.

## Credits and licence

WeeljackNg is MIT: see [LICENSE](LICENSE).

It is built on [Optimus UI](https://github.com/openng-org/optimus-ui) by OpenNG, an MIT fork of
PrimeNG v21 by PrimeTek. Their licences:
[Optimus UI](https://github.com/openng-org/optimus-ui/blob/main/LICENSE.md) and
[PrimeNG v21](https://github.com/primefaces/primeng/blob/21.0.0/LICENSE.md). Files adapted from them
are listed, with the upstream licence text, in [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

WeeljackNg is not affiliated with or endorsed by OpenNG or PrimeTek. Their names appear here only to
describe where the code comes from.
