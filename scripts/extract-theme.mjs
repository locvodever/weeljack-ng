// @ts-check
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokenValue, tokensFor } from '../projects/weeljack-ng/src/contrast.ts';
import { wjNoirOnZinc } from '../projects/weeljack-ng/src/noir-on-zinc.ts';
import { contrastRows } from './contrast-rows.mjs';

/**
 * Theme data for the docs' theming page (FR-20, 07 Q6-Q7). Writes
 * `projects/docs/src/generated/theme.json` (gitignored), so nothing on the page is pasted:
 * - `contrast`: for each scheme, the rows `check:contrast` evaluates (`contrast-rows.mjs` is the
 *   one pair list), with the tokens as `--wj-*` variables, their resolved colours, the ratio, the
 *   threshold and the verdict;
 * - `primitive` and `semantic`: the public `--wj-*` variables of the default preset. The component
 *   tier is the escape hatch (02) and is not listed.
 *
 * Imports the preset and the contrast module under Node's type stripping, as the gate does. Fails
 * (non-zero) when it yields no contrast rows or no variables, so an empty table cannot ship.
 */
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outFile = join(root, 'projects', 'docs', 'src', 'generated', 'theme.json');

/** `form.field.border.color` -> `--wj-form-field-border-color`. */
const variable = (/** @type {string} */ path) => `--wj-${path.replaceAll('.', '-')}`;

const SCHEMES = /** @type {const} */ (['light', 'dark']);
const preset = /** @type {Record<string, unknown>} */ (wjNoirOnZinc);

/** The preset limited to the public tiers, with `{a.b}` references resolvable. */
const publicTokens = {
  light: tokensFor({ primitive: preset['primitive'], semantic: preset['semantic'] }, 'light'),
  dark: tokensFor({ primitive: preset['primitive'], semantic: preset['semantic'] }, 'dark'),
};
const primitivePaths = [...tokensFor({ primitive: preset['primitive'] }, 'light').keys()];
const semanticPaths = [...tokensFor({ semantic: preset['semantic'] }, 'light').keys()];

const contrast = Object.fromEntries(
  SCHEMES.map((scheme) => [
    scheme,
    contrastRows(scheme).map((row) => ({
      pair: row.name,
      foreground: variable(row.foreground),
      foregroundValue: row.foregroundValue,
      background: variable(row.background),
      backgroundValue: row.backgroundValue,
      ratio: row.ratio.toFixed(2),
      need: String(row.need),
      verdict: row.pass ? 'PASS' : 'FAIL',
    })),
  ]),
);

/** Primitives: the border radii one by one, every colour palette as one row (`50` to `950`). */
/** @type {Map<string, { step: number, value: string }[]>} */
const palettes = new Map();
/** @type {{ variable: string, value: string }[]} */
const radii = [];
for (const path of primitivePaths) {
  const value = tokenValue(publicTokens.light, path);
  const [family = '', ...rest] = path.split('.');
  if (family === 'border') {
    radii.push({ variable: variable(path), value });
  } else {
    const steps = palettes.get(family) ?? [];
    steps.push({ step: Number(rest.join('.')), value });
    palettes.set(family, steps);
  }
}
const primitive = [
  { title: 'Border radius', rows: radii },
  {
    title: 'Colour palettes',
    rows: [...palettes].map(([family, steps]) => {
      steps.sort((a, b) => a.step - b.step);
      const first = steps[0] ?? { step: 0, value: '' };
      const last = steps[steps.length - 1] ?? first;
      return {
        variable: `--wj-${family}-{${String(first.step)}...${String(last.step)}}`,
        value: `${first.value} (${String(first.step)}) to ${last.value} (${String(last.step)})`,
      };
    }),
  },
];

/** Semantic variables, grouped by their first path segment; the order below is the page's. */
/** @type {[string, string][]} */
const GROUPS = [
  ['primary', 'Primary'],
  ['surface', 'Surface'],
  ['text', 'Text'],
  ['content', 'Content'],
  ['error', 'Error'],
  ['focus', 'Focus ring'],
  ['form', 'Form field'],
  ['list', 'List'],
  ['navigation', 'Navigation'],
  ['overlay', 'Overlay'],
  ['highlight', 'Highlight'],
  ['mask', 'Mask'],
];
/** @typedef {{ variable: string, light: string, dark: string }} SemanticRow */
/** @type {Map<string, { title: string, rows: SemanticRow[] }>} */
const grouped = new Map(GROUPS.map(([key, title]) => [key, { title, rows: [] }]));
/** @type {{ title: string, rows: SemanticRow[] }} */
const other = { title: 'Other', rows: [] };
for (const path of semanticPaths) {
  const target = grouped.get(path.split('.')[0] ?? '') ?? other;
  target.rows.push({
    variable: variable(path),
    light: tokenValue(publicTokens.light, path),
    dark: tokenValue(publicTokens.dark, path),
  });
}
const semantic = [...grouped.values(), other].filter((group) => group.rows.length > 0);

const rowCount = SCHEMES.reduce((sum, scheme) => sum + (contrast[scheme]?.length ?? 0), 0);
const variableCount = primitivePaths.length + semanticPaths.length;
if (rowCount === 0 || variableCount === 0) {
  throw new Error(
    `extract-theme: the default preset yielded ${String(rowCount)} contrast row(s) and ${String(variableCount)} variable(s); neither may be zero.`,
  );
}

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, `${JSON.stringify({ contrast, primitive, semantic }, null, 2)}\n`);
console.log(
  `extract-theme: ${String(rowCount)} contrast row(s), ${String(variableCount)} variable(s) -> theme.json`,
);
