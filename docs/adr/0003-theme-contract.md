# Theme contract

Status: accepted

An app themes WeeljackNg only through `provideWeeljack({ primary, surface, darkMode })`, read once at bootstrap: `primary` and `surface` take a base hex or a full 50–950 scale (`surface` also `{ light, dark }`), and `darkMode` is `'off'` (the default), `'system'` or `'class'` (dark while `.wj-dark` is on `<html>`); there is no raw preset, base-preset switch, radius/font/density option or runtime theme API, because an optional option can be added later without breaking anyone and a removed one cannot. Anything beyond colour is restyled by overriding the public `--wj-*` variables, and every library style — Optimus's injected styles and the `wj-*` components' own — sits in one CSS layer, `wj`, so an app's unlayered CSS always wins without `::ng-deep`. (`provideWeeljack`'s `translation` option is locale, not theme.)

Provenance: WeeljackNg library planning effort, ticket 05 (November 2026).
