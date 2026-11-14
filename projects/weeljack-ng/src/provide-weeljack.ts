import {
  CSP_NONCE,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  type EnvironmentProviders,
} from '@angular/core';
import { Optimus, provideOptimus } from '@openng/optimus-ui/config';
import { definePreset } from '@openng/optimus-ui-themes';
import { WJ_PROVIDED } from './dev-warnings';
import { wjLayerStyles } from './layer-styles';
import { wjNoirOnZinc } from './noir-on-zinc';

/** The theme options `provideWeeljack` reads once at bootstrap (05 Q3). */
export interface WjThemeOptions {
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
  const { darkMode = 'off' } = options;
  const preset = definePreset(wjNoirOnZinc, { css: wjLayerStyles });

  return makeEnvironmentProviders([
    { provide: WJ_PROVIDED, useValue: true },
    // Ahead of Optimus's own initializer: its config is static and cannot read the DI token, so
    // the nonce is on the service before the theme effect first injects a style.
    provideAppInitializer(() => {
      const nonce = inject(CSP_NONCE, { optional: true });
      if (nonce !== null) {
        inject(Optimus).csp.set({ nonce });
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
