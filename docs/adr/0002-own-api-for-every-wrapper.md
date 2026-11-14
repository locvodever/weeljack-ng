# Every wj-* component has its own API

Status: accepted

A wrapper exposes only what its documented uses need, never a mirror of the Optimus component: signal `input()`/`model()`/`output()` under one vocabulary (camelCase outputs, never `on`-prefixed; Optimus's values for `size`, `variant` and `severity`; Angular's form-state names), the wrapper itself as a form control's value accessor, typed `wj<Component><Slot>` slot directives, `wj` attribute directives over Optimus's native-element directives, and a column model for Table and TreeTable. The one escape hatch is a `pt` input forwarded verbatim to Optimus's pass-through and documented as outside the stable API; there is no `styleClass`, `dt` or `unstyled`. Mirroring would make each wrapper as wide as Optimus (Table alone has 87 inputs) and every Optimus deprecation a WeeljackNg break, while an input added later breaks nobody.

Provenance: WeeljackNg library planning effort, ticket 02 (November 2026).
