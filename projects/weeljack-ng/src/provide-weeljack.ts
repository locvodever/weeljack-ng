import {
  CSP_NONCE,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  type EnvironmentProviders,
} from '@angular/core';
import { Optimus, provideOptimus } from '@openng/optimus-ui/config';
import { _WJ_EN, _WJ_PROVIDED } from 'weeljack-ng/private';
import type { WjColorScale } from './brand';
import {
  _WJ_THEME_OPTIONS,
  _wjThemePreset,
  _wjWarnBadColours,
  _wjWarnContrast,
} from './theme-runtime';
import type { WjTranslation } from './translation';

/**
 * The theme options `provideWeeljack` reads once at bootstrap (05 Q3). `WjTheme`
 * (`weeljack-ng/theme`) can change `primary` and `surface` at runtime; nothing else changes after
 * bootstrap.
 */
export interface WjThemeOptions {
  /**
   * The brand colour: a `#rgb` / `#rrggbb` base or a `{palette}` name such as `{indigo}` (it
   * becomes a generated scale) or a full 50-950 scale. Absent, the default "Noir on zinc" ink
   * primary applies. Any other string is ignored (the default applies) and logs `WJ0200` in dev
   * mode; a brand that fails WCAG AA contrast logs `WJ0010`.
   */
  primary?: WjColorScale;
  /**
   * The surface (page, card and border) scale, with the same forms as `primary`; `{ light, dark }`
   * sets each scheme. Absent or invalid, zinc in that scheme. `surface.0` stays `#ffffff` unless the scale
   * sets `0`.
   */
  surface?: WjColorScale | { light: WjColorScale; dark: WjColorScale };
  /**
   * How dark mode is chosen. Read once; there is no runtime switch.
   * - `'off'` (default): always light.
   * - `'system'`: follows `prefers-color-scheme`.
   * - `'class'`: dark while `.wj-dark` is on `<html>`.
   */
  darkMode?: 'off' | 'system' | 'class';
  /**
   * The UI-chrome strings (`weeljack-ng/locale` ships `en` and `vi`). Merged one level deep over
   * the English default, so a partial object keeps every other string. Read once; the language
   * is not switched at runtime, and `LOCALE_ID` and `<html lang>` are left alone.
   */
  translation?: WjTranslation;
}

const DARK_MODE_SELECTORS = { off: 'none', system: 'system', class: '.wj-dark' } as const;

/**
 * Themes WeeljackNg and configures Optimus. The one place `provideOptimus` is called; apps never
 * call it themselves (09 Q6).
 *
 * Read once at bootstrap. `WjTheme` (`weeljack-ng/theme`) can change `primary` and `surface` at
 * runtime; nothing else changes after bootstrap.
 *
 * The `csp.nonce` is forwarded from Angular's `CSP_NONCE` token, which reads the `ngCspNonce`
 * attribute on the root element unless the app provides the token itself, so no option is added.
 */
export function provideWeeljack(options: WjThemeOptions = {}): EnvironmentProviders {
  const { darkMode = 'off', primary, surface, translation } = options;
  const { brand, preset } = _wjThemePreset(primary, surface);
  // Optimus's `setTranslation` is shallow, so `aria` is merged here and never passed partial.
  const merged = {
    ..._WJ_EN,
    ...translation,
    aria: { ..._WJ_EN.aria, ...translation?.aria },
    wj: { ..._WJ_EN.wj, ...translation?.wj },
  };

  return makeEnvironmentProviders([
    { provide: _WJ_PROVIDED, useValue: true },
    { provide: _WJ_THEME_OPTIONS, useValue: { primary, surface, darkMode } },
    // Ahead of Optimus's own initializer: its config is static and cannot read the DI token, so
    // the nonce is on the service before the theme effect first injects a style.
    provideAppInitializer(() => {
      const nonce = inject(CSP_NONCE, { optional: true });
      if (nonce !== null) {
        inject(Optimus).csp.set({ nonce });
      }
    }),
    provideAppInitializer(() => {
      if (!ngDevMode || (primary === undefined && surface === undefined)) {
        return;
      }
      // `_warnOnce` dedupes per code, so every bad option goes into the one message.
      _wjWarnBadColours('provideWeeljack', primary, surface);
      _wjWarnContrast('provideWeeljack', brand, darkMode);
    }),
    provideOptimus({
      translation: merged,
      theme: {
        preset,
        options: {
          prefix: 'wj',
          darkModeSelector: DARK_MODE_SELECTORS[darkMode],
          cssLayer: { name: 'wj', order: 'wj' },
        },
      },
    }),
  ]);
}
