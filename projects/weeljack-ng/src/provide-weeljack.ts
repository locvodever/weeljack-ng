import {
  CSP_NONCE,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  type EnvironmentProviders,
} from '@angular/core';
import { Optimus, provideOptimus } from '@openng/optimus-ui/config';
import { definePreset } from '@openng/optimus-ui-themes';
import { _WJ0010, _WJ_PROVIDED, _warnOnce } from 'weeljack-ng/private';
import { brandContrastIssues, brandPreset, type WjColorScale } from './brand';
import { wjLayerStyles } from './layer-styles';

/** The theme options `provideWeeljack` reads once at bootstrap (05 Q3). */
export interface WjThemeOptions {
  /**
   * The brand colour: a `#rrggbb` base (it becomes step 500 of a generated scale) or a full
   * 50-950 scale. Absent, the default "Noir on zinc" ink primary applies. In dev mode a brand
   * that fails WCAG AA contrast logs `WJ0010`.
   */
  primary?: WjColorScale;
  /**
   * The surface (page, card and border) scale, with the same forms as `primary`; `{ light, dark }`
   * sets each scheme. Absent, zinc in both schemes. `surface.0` stays `#ffffff` unless the scale
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
}

const DARK_MODE_SELECTORS = { off: 'none', system: 'system', class: '.wj-dark' } as const;

/**
 * Themes WeeljackNg and configures Optimus. The one place `provideOptimus` is called; apps never
 * call it themselves (09 Q6).
 *
 * The `csp.nonce` is forwarded from Angular's `CSP_NONCE` token, which reads the `ngCspNonce`
 * attribute on the root element unless the app provides the token itself, so no option is added.
 */
export function provideWeeljack(options: WjThemeOptions = {}): EnvironmentProviders {
  const { darkMode = 'off', primary, surface } = options;
  const brand = brandPreset(primary, surface);
  const preset = definePreset(brand, { css: wjLayerStyles });

  return makeEnvironmentProviders([
    { provide: _WJ_PROVIDED, useValue: true },
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
      try {
        const issues = brandContrastIssues(
          brand,
          darkMode === 'off' ? ['light'] : ['light', 'dark'],
        );
        if (issues.length > 0) {
          _warnOnce(
            _WJ0010,
            'provideWeeljack',
            `the brand colours fail WCAG AA contrast: ${issues.join('; ')}`,
            'Use a darker step of the scale, or override the named --wj-* variables',
          );
        }
      } catch {
        // A colour the check cannot parse is Optimus's to report; a dev warning never blocks.
      }
    }),
    provideOptimus({
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
