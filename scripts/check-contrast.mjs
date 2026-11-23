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
 *
 * "Named palettes" then checks every Aura colour palette, the neutrals included, as a `'{name}'`
 * primary on each of the five surfaces, light and dark, through `brandPreset` (which applies the
 * generated `palette-steps.ts`): the full pair list plus the brand pairs, so a future Optimus
 * palette change fails here, not in an app's console. Each failing palette counts in `FAIL rows`.
 */
import { loadBrand } from './brand-reader.mjs';
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

const { brandPreset, brandContrastIssues, tokensFor, tokenValue, pairRatio, aura } =
  await loadBrand();
const SURFACES = ['zinc', 'slate', 'gray', 'neutral', 'stone'];

console.log(`
## Named palettes, light and dark, on ${SURFACES.join(', ')}`);
for (const [name, scale] of Object.entries(aura.primitive)) {
  if (typeof scale !== 'object' || !('500' in scale)) {
    continue;
  }
  const problems = [];
  let worst = Infinity;
  for (const surface of SURFACES) {
    const preset = brandPreset(`{${name}}`, `{${surface}}`);
    problems.push(...brandContrastIssues(preset, ['light', 'dark']).map((p) => `${surface}: ${p}`));
    for (const scheme of /** @type {const} */ (['light', 'dark'])) {
      for (const row of contrastRows(scheme, preset)) {
        if (!row.pass) {
          problems.push(
            `${surface} ${scheme}: ${row.name} is ${row.ratio.toFixed(2)}:1, needs ${String(row.need)}:1`,
          );
        }
      }
    }
    const tokens = tokensFor(preset, 'light');
    worst = Math.min(worst, pairRatio(tokens, 'button.primary.color', 'button.primary.background'));
  }
  const hex = tokenValue(tokensFor(brandPreset(`{${name}}`, undefined), 'light'), 'primary.color');
  const pass = problems.length === 0;
  if (!pass) {
    failures += 1;
  }
  console.log(
    `${pass ? 'PASS' : 'FAIL'}  ${worst.toFixed(2).padStart(5)}:1  {${name}}  light primary.color ${hex}${pass ? '' : `  ${problems.join('; ')}`}`,
  );
}

console.log(`
FAIL rows: ${String(failures)}`);
if (failures > 0) {
  process.exit(1);
}
