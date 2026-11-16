// @ts-check
/**
 * `npm run check:contrast` (FR-29, 22 Q5 (1)): resolves the default preset, "Noir on zinc", in
 * both schemes and fails any pair under 4.5:1 (text) or 3:1 (non-text).
 *
 * Made permanent from the default-look prototype's `22-contrast-check.mjs` (variant B pair list).
 * Where the prototype listed hand-copied hex values, every pair here names the preset token that
 * paints it, so a change to the preset is what gets checked, not a copy of it.
 *
 * Imports the preset source directly under Node's type stripping, so that file stays
 * erasable-TypeScript with `@openng/*` imports only. The contrast math is the shared
 * `contrast.ts` (also read by the dev-mode brand warning), which has no imports at all.
 */
import { pairRatio, tokensFor } from '../projects/weeljack-ng/src/contrast.ts';
import { wjNoirOnZinc } from '../projects/weeljack-ng/src/noir-on-zinc.ts';

const TEXT = 4.5;
const NON_TEXT = 3;

/** @typedef {[name: string, foreground: string, background: string, need: number, layer?: string]} Pair */

/** @type {Record<'light' | 'dark', Pair[]>} */
const PAIRS = {
  light: [
    ['body text', 'text.color', 'surface.0', TEXT],
    ['muted/hint text on cards', 'text.muted.color', 'surface.0', TEXT],
    ['muted text on the page', 'text.muted.color', 'surface.50', TEXT],
    ['primary button', 'button.primary.color', 'button.primary.background', TEXT],
    ['primary button hover', 'button.primary.hover.color', 'button.primary.hover.background', TEXT],
    [
      'primary button active',
      'button.primary.active.color',
      'button.primary.active.background',
      TEXT,
    ],
    ['focus ring on cards', 'focus.ring.color', 'surface.0', NON_TEXT],
    ['focus ring on the page', 'focus.ring.color', 'surface.50', NON_TEXT],
    ['field border', 'form.field.border.color', 'form.field.background', NON_TEXT],
    ['checkbox border', 'checkbox.border.color', 'checkbox.background', NON_TEXT],
    ['checkbox check', 'checkbox.icon.checked.color', 'checkbox.checked.background', NON_TEXT],
    ['switch off track', 'toggleswitch.background', 'surface.0', NON_TEXT],
    [
      'switch handle on track',
      'toggleswitch.handle.background',
      'toggleswitch.background',
      NON_TEXT,
    ],
    ['placeholder', 'form.field.placeholder.color', 'form.field.background', TEXT],
    ['invalid border', 'form.field.invalid.border.color', 'form.field.background', NON_TEXT],
    ['error text', 'error.color', 'surface.0', TEXT],
    ['success button', 'button.success.color', 'button.success.background', TEXT],
    ['info button', 'button.info.color', 'button.info.background', TEXT],
    ['warn button', 'button.warn.color', 'button.warn.background', TEXT],
    ['danger button', 'button.danger.color', 'button.danger.background', TEXT],
    ['secondary button', 'button.secondary.color', 'button.secondary.background', TEXT],
    ['outlined secondary button text', 'button.outlined.secondary.color', 'surface.0', TEXT],
    ['tag info', 'tag.info.color', 'tag.info.background', TEXT],
    ['tag warn', 'tag.warn.color', 'tag.warn.background', TEXT],
    ['tag secondary', 'tag.secondary.color', 'tag.secondary.background', TEXT],
    ['tag success', 'tag.success.color', 'tag.success.background', TEXT],
    ['tag danger', 'tag.danger.color', 'tag.danger.background', TEXT],
    ['toast success summary', 'toast.success.color', 'toast.success.background', TEXT, 'surface.0'],
    ['toast error summary', 'toast.error.color', 'toast.error.background', TEXT, 'surface.0'],
    ['toast warn summary', 'toast.warn.color', 'toast.warn.background', TEXT, 'surface.0'],
    ['toast info summary', 'toast.info.color', 'toast.info.background', TEXT, 'surface.0'],
    ['selected option', 'list.option.selected.color', 'list.option.selected.background', TEXT],
  ],
  dark: [
    ['body text', 'text.color', 'content.background', TEXT],
    ['muted text on cards', 'text.muted.color', 'content.background', TEXT],
    ['muted text on the page', 'text.muted.color', 'surface.950', TEXT],
    ['primary button', 'button.primary.color', 'button.primary.background', TEXT],
    ['primary button hover', 'button.primary.hover.color', 'button.primary.hover.background', TEXT],
    [
      'primary button active',
      'button.primary.active.color',
      'button.primary.active.background',
      TEXT,
    ],
    ['focus ring on cards', 'focus.ring.color', 'content.background', NON_TEXT],
    ['field border on the field', 'form.field.border.color', 'form.field.background', NON_TEXT],
    ['field border around the field', 'form.field.border.color', 'content.background', NON_TEXT],
    ['checkbox check', 'checkbox.icon.checked.color', 'checkbox.checked.background', NON_TEXT],
    ['switch off track', 'toggleswitch.background', 'content.background', NON_TEXT],
    [
      'switch handle on track',
      'toggleswitch.handle.background',
      'toggleswitch.background',
      NON_TEXT,
    ],
    ['placeholder', 'form.field.placeholder.color', 'form.field.background', TEXT],
    ['invalid border', 'form.field.invalid.border.color', 'form.field.background', NON_TEXT],
    ['error text', 'error.color', 'content.background', TEXT],
    ['success button', 'button.success.color', 'button.success.background', TEXT],
    ['danger button', 'button.danger.color', 'button.danger.background', TEXT],
    ['secondary button', 'button.secondary.color', 'button.secondary.background', TEXT],
    ['tag success', 'tag.success.color', 'tag.success.background', TEXT, 'content.background'],
    [
      'selected option',
      'list.option.selected.color',
      'list.option.selected.background',
      TEXT,
      'content.background',
    ],
  ],
};

let failures = 0;
for (const scheme of /** @type {const} */ (['light', 'dark'])) {
  const tokens = tokensFor(wjNoirOnZinc, scheme);
  console.log(`
## Noir on zinc, ${scheme}`);
  for (const [name, foreground, background, need, layer] of PAIRS[scheme]) {
    const value = pairRatio(tokens, foreground, background, layer);
    const ok = value >= need;
    if (!ok) {
      failures += 1;
    }
    console.log(
      `${ok ? 'PASS' : 'FAIL'}  ${value.toFixed(2).padStart(5)}:1  (need ${String(need)})  ${name}`,
    );
  }
}

console.log(`
FAIL rows: ${String(failures)}`);
if (failures > 0) {
  process.exit(1);
}
