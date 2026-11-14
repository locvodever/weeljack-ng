# Versioning

Status: accepted

WeeljackNg uses its own semver, not Angular's numbers, and the README maps each WeeljackNg line to its Angular major and Optimus line. Before 1.0, each wave of wrappers closes with the next minor (`0.1.0`, `0.2.0`, …), patches carry fixes and finished components between closes, and a breaking `wj-*` change ships only in a wave-closing minor with a migration note; `1.0.0` closes the overlays-and-menus wave, and the cuttable long tail ships as 1.x minors. From 1.0 a removed input or output is first marked `@deprecated` for one minor, dropping an Angular major is a major release, and an older line gets a `v<N>.x` branch and `v<N>-lts` dist-tag only when a consumer is stuck on its Angular major.

## Considered Options

Angular's numbering (22.x, breaking only at Angular majors) would hold every breaking wrapper change until the next Angular major; `1.0.0` straight after wave 1 would freeze the wrapper conventions before their hardest cases, Table and Tree in the data wave and the overlays.

Provenance: WeeljackNg library planning effort, ticket 14 (November 2026).
