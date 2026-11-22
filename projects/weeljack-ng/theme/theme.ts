import { isPlatformBrowser } from '@angular/common';
import {
  DOCUMENT,
  Injectable,
  Injector,
  PLATFORM_ID,
  inject,
  runInInjectionContext,
  signal,
  type Signal,
} from '@angular/core';
import { Optimus } from '@openng/optimus-ui/config';
import { usePreset } from '@openng/optimus-ui-themes';
import {
  _WJ_THEME_OPTIONS,
  _wjThemePreset,
  _wjWarnBadColours,
  _wjWarnContrast,
  type WjColorScale,
  type WjThemeOptions,
} from 'weeljack-ng';
import { _checkWeeljackSetup } from 'weeljack-ng/private';

/** The component token sheets are the `-variables` sheets that are not one of these three. */
const COMMON_SHEETS = new Set(['primitive-variables', 'semantic-variables', 'global-variables']);

/**
 * Changes the brand `primary` and the `surface` after bootstrap (ADR 0009). The result is what
 * `provideWeeljack` would have produced with those values, in light and dark: both build the
 * preset with the same code, and every mounted component re-themes at once.
 *
 * Only `primary` and `surface` change. Dark mode, radius, fonts and the translation stay as
 * `provideWeeljack` read them. An app that never imports `weeljack-ng/theme` ships none of this.
 *
 * Every method does nothing on the server, because Optimus's theme is shared by every request
 * there. The server renders the `provideWeeljack` theme, and the browser applies a switch after
 * it loads. Without `provideWeeljack` the methods do nothing too, and `WJ0001` is logged in dev
 * mode.
 */
@Injectable({ providedIn: 'root' })
export class WjTheme {
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly optimus = inject(Optimus);
  private readonly options = inject(_WJ_THEME_OPTIONS, { optional: true });
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly primaryState = signal<WjColorScale | undefined>(this.options?.primary);
  private readonly surfaceState = signal<WjThemeOptions['surface']>(this.options?.surface);

  /**
   * The primary in effect, as given: the `provideWeeljack` value until a call is accepted.
   * `undefined` is the default "Noir on zinc" ink primary.
   */
  readonly primary: Signal<WjColorScale | undefined> = this.primaryState.asReadonly();

  /**
   * The surface in effect, as given: the `provideWeeljack` value until a call is accepted.
   * `undefined` is zinc.
   */
  readonly surface: Signal<WjThemeOptions['surface']> = this.surfaceState.asReadonly();

  constructor() {
    _checkWeeljackSetup('WjTheme');
  }

  /**
   * Changes the brand colour, in the forms of `WjThemeOptions.primary`: a `#rgb` / `#rrggbb` base,
   * a `{palette}` name or a full 50-950 scale. Omit it to return to the `provideWeeljack`
   * primary. The surface in effect is kept.
   *
   * A string that is not a colour logs `WJ0200` in dev mode, once per distinct message, and
   * changes nothing, in production too. A colour that fails WCAG AA contrast applies and logs
   * `WJ0010` in dev mode, once per distinct palette. Does nothing on the server.
   */
  setPrimary(primary?: WjColorScale): void {
    if (this.options === null || !this.browser) {
      return;
    }
    const bad = runInInjectionContext(this.injector, () =>
      _wjWarnBadColours('WjTheme', primary, undefined, true),
    );
    if (bad.length === 0) {
      this.apply(primary ?? this.options.primary, this.surfaceState());
    }
  }

  /**
   * Changes the surface (page, card and border) scale, in the forms of `WjThemeOptions.surface`,
   * including `{ light, dark }`. Omit it to return to the `provideWeeljack` surface. The primary
   * in effect is kept.
   *
   * The rules are those of `setPrimary`: an invalid string logs `WJ0200` and changes nothing.
   * Does nothing on the server.
   */
  setSurface(surface?: WjThemeOptions['surface']): void {
    if (this.options === null || !this.browser) {
      return;
    }
    const bad = runInInjectionContext(this.injector, () =>
      _wjWarnBadColours('WjTheme', undefined, surface, true),
    );
    if (bad.length === 0) {
      this.apply(this.primaryState(), surface ?? this.options.surface);
    }
  }

  /**
   * Returns the primary and the surface to what `provideWeeljack` set. Nothing is validated: the
   * bootstrap already reported its own values. Does nothing on the server.
   */
  reset(): void {
    if (this.options !== null && this.browser) {
      this.apply(this.options.primary, this.options.surface);
    }
  }

  private apply(primary: WjColorScale | undefined, surface: WjThemeOptions['surface']): void {
    this.primaryState.set(primary);
    this.surfaceState.set(surface);
    const { brand, preset } = _wjThemePreset(primary, surface);
    // A component's token sheet is rewritten when it is mounted. Dropping the others makes the
    // page's variables equal a fresh bootstrap's, not only those of the components on screen.
    for (const sheet of this.document.head.querySelectorAll(
      'style[data-optimus-style-id$="-variables"]',
    )) {
      if (!COMMON_SHEETS.has(sheet.getAttribute('data-optimus-style-id') ?? '')) {
        sheet.remove();
      }
    }
    // Mounted components reload their sheets on `theme:change`, synchronously. The common sheets
    // are loaded by a component too, so with none mounted they are written here.
    usePreset(preset);
    this.optimus.loadCommonTheme();
    runInInjectionContext(this.injector, () => {
      _wjWarnContrast('WjTheme', brand, this.options?.darkMode, true);
    });
  }
}
