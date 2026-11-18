// @ts-check
/**
 * The contrast pair list and its evaluation, shared by `check-contrast.mjs` (the gate) and
 * `extract-theme.mjs` (the docs page's table), so the page shows exactly what the gate checks.
 *
 * Every pair names the preset token that paints it, so a change to the preset is what gets
 * checked, not a copy of it. The math is the shared `contrast.ts` (also read by the dev-mode brand
 * warning); the preset is imported directly under Node's type stripping, so that file stays
 * erasable-TypeScript with `@openng/*` imports only.
 */
import { pairRatio, tokenValue, tokensFor } from '../projects/weeljack-ng/src/contrast.ts';
import { wjNoirOnZinc } from '../projects/weeljack-ng/src/noir-on-zinc.ts';

export const TEXT = 4.5;
export const NON_TEXT = 3;

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
    ['message info', 'message.info.color', 'message.info.background', TEXT, 'surface.0'],
    ['message success', 'message.success.color', 'message.success.background', TEXT, 'surface.0'],
    ['message warn', 'message.warn.color', 'message.warn.background', TEXT, 'surface.0'],
    ['message error', 'message.error.color', 'message.error.background', TEXT, 'surface.0'],
    [
      'message secondary',
      'message.secondary.color',
      'message.secondary.background',
      TEXT,
      'surface.0',
    ],
    [
      'message contrast',
      'message.contrast.color',
      'message.contrast.background',
      TEXT,
      'surface.0',
    ],
    ['message info outlined text', 'message.info.outlined.color', 'surface.0', TEXT],
    ['message success outlined text', 'message.success.outlined.color', 'surface.0', TEXT],
    ['message warn outlined text', 'message.warn.outlined.color', 'surface.0', TEXT],
    ['message error outlined text', 'message.error.outlined.color', 'surface.0', TEXT],
    [
      'message info close ring',
      'message.info.close.button.focus.ring.color',
      'message.info.background',
      NON_TEXT,
      'surface.0',
    ],
    [
      'message success close ring',
      'message.success.close.button.focus.ring.color',
      'message.success.background',
      NON_TEXT,
      'surface.0',
    ],
    [
      'message warn close ring',
      'message.warn.close.button.focus.ring.color',
      'message.warn.background',
      NON_TEXT,
      'surface.0',
    ],
    [
      'message error close ring',
      'message.error.close.button.focus.ring.color',
      'message.error.background',
      NON_TEXT,
      'surface.0',
    ],
    ['spinner colour red', 'progressspinner.color.one', 'surface.0', NON_TEXT],
    ['spinner colour blue', 'progressspinner.color.two', 'surface.0', NON_TEXT],
    ['spinner colour green', 'progressspinner.color.three', 'surface.0', NON_TEXT],
    ['spinner colour yellow', 'progressspinner.color.four', 'surface.0', NON_TEXT],
    [
      'progress fill on the track',
      'progressbar.value.background',
      'progressbar.background',
      NON_TEXT,
    ],
    ['progress label on the fill', 'progressbar.label.color', 'progressbar.value.background', TEXT],
    ['badge primary', 'badge.primary.color', 'badge.primary.background', TEXT],
    ['badge secondary', 'badge.secondary.color', 'badge.secondary.background', TEXT],
    ['badge success', 'badge.success.color', 'badge.success.background', TEXT],
    ['badge info', 'badge.info.color', 'badge.info.background', TEXT],
    ['badge warn', 'badge.warn.color', 'badge.warn.background', TEXT],
    ['badge danger', 'badge.danger.color', 'badge.danger.background', TEXT],
    ['badge contrast', 'badge.contrast.color', 'badge.contrast.background', TEXT],
    ['selected tree node', 'tree.node.selected.color', 'tree.node.selected.background', TEXT],
    [
      'selected tree-table row',
      'treetable.row.selected.color',
      'treetable.row.selected.background',
      TEXT,
    ],
    ['breadcrumb link text', 'breadcrumb.item.color', 'content.background', TEXT],
    ['breadcrumb link text on hover', 'breadcrumb.item.hover.color', 'content.background', TEXT],
    ['breadcrumb home glyph', 'breadcrumb.item.icon.color', 'content.background', NON_TEXT],
    [
      'breadcrumb home glyph on hover',
      'breadcrumb.item.icon.hover.color',
      'content.background',
      NON_TEXT,
    ],
    ['steps label', 'steps.item.label.color', 'content.background', TEXT],
    ['steps label, current', 'steps.item.label.active.color', 'content.background', TEXT],
    ['steps number', 'steps.item.number.color', 'steps.item.number.background', TEXT],
    // The current number is filled with the primary (steps.css), so this is the pair drawn: the
    // preset's own active-number colour on the content background is no longer on screen.
    ['steps number, current (filled)', 'primary.contrast.color', 'primary.color', TEXT],
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
      'toast success summary',
      'toast.success.color',
      'toast.success.background',
      TEXT,
      'content.background',
    ],
    [
      'toast error summary',
      'toast.error.color',
      'toast.error.background',
      TEXT,
      'content.background',
    ],
    ['toast warn summary', 'toast.warn.color', 'toast.warn.background', TEXT, 'content.background'],
    ['toast info summary', 'toast.info.color', 'toast.info.background', TEXT, 'content.background'],
    [
      'selected option',
      'list.option.selected.color',
      'list.option.selected.background',
      TEXT,
      'content.background',
    ],
    ['message info', 'message.info.color', 'message.info.background', TEXT, 'content.background'],
    [
      'message success',
      'message.success.color',
      'message.success.background',
      TEXT,
      'content.background',
    ],
    ['message warn', 'message.warn.color', 'message.warn.background', TEXT, 'content.background'],
    [
      'message error',
      'message.error.color',
      'message.error.background',
      TEXT,
      'content.background',
    ],
    [
      'message secondary',
      'message.secondary.color',
      'message.secondary.background',
      TEXT,
      'content.background',
    ],
    [
      'message contrast',
      'message.contrast.color',
      'message.contrast.background',
      TEXT,
      'content.background',
    ],
    ['message info outlined text', 'message.info.outlined.color', 'content.background', TEXT],
    ['message success outlined text', 'message.success.outlined.color', 'content.background', TEXT],
    ['message warn outlined text', 'message.warn.outlined.color', 'content.background', TEXT],
    ['message error outlined text', 'message.error.outlined.color', 'content.background', TEXT],
    [
      'message info close ring',
      'message.info.close.button.focus.ring.color',
      'message.info.background',
      NON_TEXT,
      'content.background',
    ],
    [
      'message success close ring',
      'message.success.close.button.focus.ring.color',
      'message.success.background',
      NON_TEXT,
      'content.background',
    ],
    [
      'message warn close ring',
      'message.warn.close.button.focus.ring.color',
      'message.warn.background',
      NON_TEXT,
      'content.background',
    ],
    [
      'message error close ring',
      'message.error.close.button.focus.ring.color',
      'message.error.background',
      NON_TEXT,
      'content.background',
    ],
    ['spinner colour red', 'progressspinner.color.one', 'content.background', NON_TEXT],
    ['spinner colour blue', 'progressspinner.color.two', 'content.background', NON_TEXT],
    ['spinner colour green', 'progressspinner.color.three', 'content.background', NON_TEXT],
    ['spinner colour yellow', 'progressspinner.color.four', 'content.background', NON_TEXT],
    [
      'progress fill on the track',
      'progressbar.value.background',
      'progressbar.background',
      NON_TEXT,
    ],
    ['progress label on the fill', 'progressbar.label.color', 'progressbar.value.background', TEXT],
    ['badge primary', 'badge.primary.color', 'badge.primary.background', TEXT],
    ['badge secondary', 'badge.secondary.color', 'badge.secondary.background', TEXT],
    ['badge success', 'badge.success.color', 'badge.success.background', TEXT],
    ['badge info', 'badge.info.color', 'badge.info.background', TEXT],
    ['badge warn', 'badge.warn.color', 'badge.warn.background', TEXT],
    ['badge danger', 'badge.danger.color', 'badge.danger.background', TEXT],
    ['badge contrast', 'badge.contrast.color', 'badge.contrast.background', TEXT],
    [
      'selected tree node',
      'tree.node.selected.color',
      'tree.node.selected.background',
      TEXT,
      'content.background',
    ],
    [
      'selected tree-table row',
      'treetable.row.selected.color',
      'treetable.row.selected.background',
      TEXT,
      'content.background',
    ],
    ['breadcrumb link text', 'breadcrumb.item.color', 'content.background', TEXT],
    ['breadcrumb link text on hover', 'breadcrumb.item.hover.color', 'content.background', TEXT],
    ['breadcrumb home glyph', 'breadcrumb.item.icon.color', 'content.background', NON_TEXT],
    [
      'breadcrumb home glyph on hover',
      'breadcrumb.item.icon.hover.color',
      'content.background',
      NON_TEXT,
    ],
    ['steps label', 'steps.item.label.color', 'content.background', TEXT],
    ['steps label, current', 'steps.item.label.active.color', 'content.background', TEXT],
    ['steps number', 'steps.item.number.color', 'steps.item.number.background', TEXT],
    // The current number is filled with the primary (steps.css), so this is the pair drawn: the
    // preset's own active-number colour on the content background is no longer on screen.
    ['steps number, current (filled)', 'primary.contrast.color', 'primary.color', TEXT],
  ],
};

/**
 * One evaluated pair: its name, the foreground and background tokens and their resolved colours,
 * the optional layer a translucent background composites over, the ratio and what it needs.
 * @typedef {{ name: string, foreground: string, foregroundValue: string, background: string,
 *   backgroundValue: string, layer: string | null, ratio: number, need: number, pass: boolean }} ContrastRow
 */

/**
 * Every pair of the default preset, "Noir on zinc", resolved for one scheme.
 * @param {'light' | 'dark'} scheme
 * @returns {ContrastRow[]}
 */
export function contrastRows(scheme) {
  const tokens = tokensFor(wjNoirOnZinc, scheme);
  return PAIRS[scheme].map(([name, foreground, background, need, layer]) => {
    const ratio = pairRatio(tokens, foreground, background, layer);
    return {
      name,
      foreground,
      foregroundValue: tokenValue(tokens, foreground),
      background,
      backgroundValue: tokenValue(tokens, background),
      layer: layer ?? null,
      ratio,
      need,
      pass: ratio >= need,
    };
  });
}
