# Runtime colour switch

Status: accepted

An app may change `primary` and `surface` at runtime, and nothing else, through `WjTheme`, an injectable `providedIn: 'root'` service in the own entry `weeljack-ng/theme`: `setPrimary`, `setSurface` and `reset`, plus read-only `primary` and `surface` signals. It takes the same forms and follows the same rules as `provideWeeljack`: a string that is not a colour logs `WJ0200` in dev mode and changes nothing (in production too), and a palette under WCAG AA applies and logs `WJ0010`, once per distinct case. The result equals a bootstrap with those values, in light and dark, because the service and `provideWeeljack` build the preset through one function, `_wjThemePreset`; `reset()` returns to what `provideWeeljack` set. On the server every call is a no-op, since Optimus's theme is a module-level singleton that every concurrent request would share: the server renders the bootstrap theme, and the browser applies a switch after it loads. The entry reaches the preset builder through four `_`-prefixed, `@docs-private` exports of the root, outside semver like `weeljack-ng/private`'s, and Optimus stays behind it (ADR 0001): no Optimus type appears in its public surface. An app that never imports `weeljack-ng/theme` ships none of its code.

**This amends ADR 0003 additively**, and the rest of it stands: there is still no raw preset, no base-preset switch, no dark-mode switch and no radius, font or density option, and ADR 0003's "no runtime theme API" now reads as "no runtime theme API beyond primary and surface". ADR 0003 itself is not edited.

## Considered Options

- **Optimus's `updatePrimaryPalette` / `updateSurfacePalette`.** Rejected: they merge a palette into the live preset and cannot drop the Noir layer's own primary tokens, so the result is not what a bootstrap with that primary produces.
- **`Optimus.theme.set`.** Rejected: it applies through an effect, so a switch is not synchronous, and it still needs the whole preset.
- **A runtime API in the root entry.** Rejected: every app would pay for it, including those that never switch.
- **Only overriding `--wj-*` variables.** Rejected as the answer: an app can already do it, but gets no generated scale and no contrast check.

Provenance: Loc's decision, 2026-11-22 (theme panel).
