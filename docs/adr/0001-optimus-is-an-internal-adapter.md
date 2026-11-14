# Optimus UI is an internal adapter

Status: accepted

WeeljackNg wraps Optimus UI (`@openng/optimus-ui`, the MIT fork of PrimeNG v21) behind its own published interface — the `wj-*` selectors with their signal inputs and outputs, `Wj*` types and services, `provideWeeljack`, and the `--wj-*` CSS variables — and Optimus shows through in exactly two places: it is a peer dependency (`@openng/optimus-ui` and `@openng/optimus-ui-themes` at one shared exact-minor range, never in `dependencies`), and each wrapper's `pt` input, typed as a re-exported `Wj<Name>Pt`, documented as tracking Optimus, whose part changes ship only with a new Optimus minor and are not counted as breaking. Nothing else from Optimus is re-exported, `provideWeeljack` makes the only `provideOptimus` call, and lint bans `@openng/*` imports outside the library source, so an Optimus rename, or a later swap of what sits under the wrappers, never reaches an app. Tests render real Optimus through the same interface; there is no internal port, because one adapter has nothing varying across it.

## Considered Options

Exposing Optimus as part of the interface (re-exported `api` types and services, apps calling `provideOptimus` and importing Optimus directly) is less work up front, but every Optimus rename then reaches every app, and a second `provideOptimus` call silently overwrites WeeljackNg's prefix, layer and dark-mode settings.

Provenance: WeeljackNg library planning effort, ticket 09 (November 2026).
