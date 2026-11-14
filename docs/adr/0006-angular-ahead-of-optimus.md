# When Angular moves before Optimus

Status: accepted

If an Angular major ships before Optimus supports it, WeeljackNg stays on the previous Angular major instead of forking or vendoring Optimus, because Angular's LTS outlasts the lags seen so far and the `wj-*` API already hides whatever sits underneath. A canary builds WeeljackNg against the new major at its `next`/RC stage, and the fork question reopens as a new decision only if Optimus has no compatible release 6 months after the major's `.0.0`, or a published Optimus advisory stays unpatched for 30 days. Any fork covers the whole Optimus family, never only the components it blocks — every component reaches Optimus's peer-locked core — and copies only from Optimus or PrimeNG v21 and earlier.

Provenance: WeeljackNg library planning effort, ticket 18 (November 2026).
