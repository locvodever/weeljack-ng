import { InjectionToken } from '@angular/core';
import { definePreset } from '@openng/optimus-ui-themes';
import { _WJ0010, _warnOnce } from 'weeljack-ng/private';
import { badColours, brandContrastIssues, brandPreset, type WjColorScale } from './brand';
import { wjLayerStyles } from './layer-styles';
import type { WjThemeOptions } from './provide-weeljack';

/** A brand option whose string is not a colour (`provideWeeljack` and `WjTheme` share it). */
const WJ0200 = 'WJ0200';

/**
 * The theme options `provideWeeljack` was given, as given (`darkMode` defaulted to `'off'`).
 * `WjTheme` reads them to know what `reset()` returns to.
 *
 * @docs-private
 */
export const _WJ_THEME_OPTIONS = new InjectionToken<
  Pick<WjThemeOptions, 'primary' | 'surface' | 'darkMode'>
>('WJ_THEME_OPTIONS');

/**
 * The one place a brand becomes an Optimus preset, so `provideWeeljack` and `WjTheme` cannot
 * drift. `brand` is what the contrast check reads; `preset` is what Optimus applies (the brand
 * with the layer styles on top).
 *
 * @docs-private
 */
export function _wjThemePreset(
  primary: WjColorScale | undefined,
  surface: WjThemeOptions['surface'],
) {
  const brand = brandPreset(primary, surface);
  return { brand, preset: definePreset(brand, { css: wjLayerStyles }) };
}

/**
 * The options whose string is not a colour, as `option 'value'`. In dev mode a non-empty list is
 * also warned as `WJ0200`; the check itself runs in production too. Must run in an injection
 * context. `perMessage` dedupes the warning per distinct case instead of per code.
 *
 * @docs-private
 */
export function _wjWarnBadColours(
  selector: string,
  primary: WjColorScale | undefined,
  surface: WjThemeOptions['surface'],
  perMessage = false,
): string[] {
  const bad = badColours(primary, surface);
  if (ngDevMode && bad.length > 0) {
    // `extract-errors.mjs` reads the message from this call, so it is written inline.
    _warnOnce(
      WJ0200,
      selector,
      `not a colour: ${bad.join(', ')}`,
      'Pass #rrggbb, a {palette} or a scale',
      perMessage ? bad.join(', ') : undefined,
    );
  }
  return bad;
}

/**
 * Dev mode only: warns `WJ0010` when the brand fails the WCAG AA pairs, in light only when
 * `darkMode` is `'off'`. Must run in an injection context. `perMessage` dedupes the warning per
 * distinct case instead of per code.
 *
 * @docs-private
 */
export function _wjWarnContrast(
  selector: string,
  brand: unknown,
  darkMode: WjThemeOptions['darkMode'],
  perMessage = false,
): void {
  if (!ngDevMode) {
    return;
  }
  try {
    const issues = brandContrastIssues(brand, darkMode === 'off' ? ['light'] : ['light', 'dark']);
    if (issues.length > 0) {
      _warnOnce(
        _WJ0010,
        selector,
        `the brand colours fail WCAG AA contrast: ${issues.join('; ')}`,
        'Use a darker step of the scale, or override the named --wj-* variables',
        perMessage ? issues.join('; ') : undefined,
      );
    }
  } catch {
    // A colour the check cannot parse is Optimus's to report; a dev warning never blocks.
  }
}
