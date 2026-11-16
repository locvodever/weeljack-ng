// @ts-check
/**
 * `npm run check:contrast` (FR-29, 22 Q5 (1)): resolves the default preset, "Noir on zinc", in
 * both schemes and fails any pair under 4.5:1 (text) or 3:1 (non-text).
 *
 * Made permanent from the default-look prototype's `22-contrast-check.mjs` (variant B pair list).
 * Where the prototype listed hand-copied hex values, every pair here names the preset token that
 * paints it, so a change to the preset is what gets checked, not a copy of it.
 *
 * The pair list and its evaluation live in `contrast-rows.mjs`, which the docs page's generator
 * (`extract-theme.mjs`) reads too, so the page shows exactly what this gate checks.
 */
import { contrastRows } from './contrast-rows.mjs';

let failures = 0;
for (const scheme of /** @type {const} */ (['light', 'dark'])) {
  console.log(`
## Noir on zinc, ${scheme}`);
  for (const { name, ratio, need, pass } of contrastRows(scheme)) {
    if (!pass) {
      failures += 1;
    }
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${ratio.toFixed(2).padStart(5)}:1  (need ${String(need)})  ${name}`,
    );
  }
}

console.log(`
FAIL rows: ${String(failures)}`);
if (failures > 0) {
  process.exit(1);
}
