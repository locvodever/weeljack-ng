# Package name and entry points

Status: accepted

WeeljackNg is one public, unscoped npm package, `weeljack-ng`, spelled without the "h" on purpose — it is not a typo to fix — and a `@weeljack-ng/*` scope comes only if a second package is ever needed. The root entry is the app's setup surface (`provideWeeljack`, its types, and public symbols two or more entries share; never a component); each wrapped Optimus entry gets exactly one secondary entry under the same name (`weeljack-ng/button`, never merged or split), WeeljackNg's own components and its locale data get one each (`weeljack-ng/sheet`, `weeljack-ng/field`, `weeljack-ng/locale`), and shared internals live in `weeljack-ng/private`, outside semver. The name was first taken by a real release, not a placeholder publish, because npm treats a functionless package as squatting and a published version number can never be reused.

Provenance: WeeljackNg library planning effort, ticket 01, with the locale entry from ticket 22 (November 2026).
