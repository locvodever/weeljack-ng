# Base presets

Status: accepted

An app picks a base preset with `provideWeeljack({ preset })`, passing an object imported from its own entry: `import { wjAura } from 'weeljack-ng/preset-aura'`. The presets are a flat list, each a complete look in its own entry: `wjNoir`, `wjAura`, `wjLara`, `wjNora`, `wjMaterial` and `wjPolice`. Noir and Aura ship first; the others follow, one PR each. `primary` and `surface` still apply on top of any preset.

Only WeeljackNg's own presets are accepted. `WjPreset` is opaque: its fields are `_`-prefixed, `@docs-private` and outside semver, and no Optimus type appears in it (ADR 0001). A raw Optimus preset is rejected by the type.

Noir stays the default, with no import: `provideWeeljack()` equals `provideWeeljack({ preset: wjNoir })`. The cost is stated: the root keeps Aura, which Noir is built on, so an app on another preset also ships Aura, about 14.4 KB gzip. Making `preset` required would avoid it, but it would change 464 call sites.

Every preset holds every guarantee: 44/36/52 px controls, AA on every gate pair in light and dark, one 2 px focus ring, hit boxes of at least 24 px, reduced motion, `@layer wj` and the `wj` layer styles. Anything else that passes stays the base's own, radius and motion included. Where a base's signature fails a guarantee, the guarantee wins. The shared layer is `wjGuarantees`; Noir's look (zinc light surfaces, the 8/12 px corners and the tag radius) and its ink primary are Noir's own, so they are one preset's choices and no longer part of every preset.

`_wjThemePreset` builds a preset for bootstrap and for `WjTheme` alike, through `brandPreset(primary, surface, preset)`: the preset's base, the guarantees, the preset's look, then the colour or the ink, then the app's `surface`, with the layer styles added last. An app's valid `primary` replaces the preset's own colour or ink and keeps its look.

**This amends ADR 0003 additively.** The preset option is added. "No raw preset" stands. "No base-preset switch" now reads "no base preset other than WeeljackNg's own, chosen through `preset`". ADR 0003 itself is not edited.

**This amends ADR 0009 additively.** Runtime now means primary, surface and preset, and nothing else. `WjTheme.setPreset` builds through the same function, removes the leftover component `-style` sheets and is a no-op on the server. It lands in the next PR. ADR 0009 itself is not edited.

## Considered Options

- **A string name.** Rejected: it would ship every base to every app (about 447 KB raw, 58.8 KB gzip).
- **`preset` required.** Rejected: 464 call sites in 131 files.
- **Accepting raw Optimus presets.** Rejected: the guarantees could not hold, and ADR 0003 rules them out.
- **Presets at bootstrap only, with a docs reload.** Rejected: all four bases, about 447 KB raw, would sit in the docs initial bundle.
- **Aura-tuned AA corrections moved out of the shared layer.** Rejected: it voids the measured per-base corrections.

Provenance: Loc's decision, 2026-11-22 (WeeljackNg presets effort, tickets 05, 06, 07, 09 and 12; ratified "Yes, all of it").
