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
import { Theme, usePreset } from '@openng/optimus-ui-themes';
import {
  _WJ_THEME_OPTIONS,
  _wjThemePreset,
  _wjWarnBadColours,
  _wjWarnContrast,
  type WjColorScale,
  type WjPreset,
  type WjThemeOptions,
} from 'weeljack-ng';
import { _checkWeeljackSetup } from 'weeljack-ng/private';

/** The component token sheets are the `-variables` sheets that are not one of these three. */
const COMMON_SHEETS = new Set(['primitive-variables', 'semantic-variables', 'global-variables']);

/**
 * Changes the brand `primary`, the `surface` and the base `preset` after bootstrap (ADR 0009,
 * amended by ADR 0010). The result is what `provideWeeljack` would have produced with those
 * values, in light and dark: both build the preset with the same code, and every mounted component
 * re-themes at once.
 *
 * Only `primary`, `surface` and `preset` change. Dark mode, fonts and the translation stay as
 * `provideWeeljack` read them, and the radius changes only as part of a preset. An app that never
 * imports `weeljack-ng/theme` ships none of this.
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
  private readonly presetState = signal<WjPreset | undefined>(this.options?.preset);

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

  /**
   * The base preset in effect, as given: the `provideWeeljack` value until a call is accepted.
   * `undefined` is the default, Noir.
   */
  readonly preset: Signal<WjPreset | undefined> = this.presetState.asReadonly();

  constructor() {
    _checkWeeljackSetup('WjTheme');
  }

  /**
   * Changes the brand colour, in the forms of `WjThemeOptions.primary`: a `#rgb` / `#rrggbb` base,
   * a `{palette}` name or a full 50-950 scale. Omit it to return to the `provideWeeljack`
   * primary. The surface and the preset in effect are kept.
   *
   * A string that is not a colour logs `WJ0200` in dev mode, once per distinct message, and
   * changes nothing, in production too. A `{palette}` name takes its AA step in light, as in
   * `provideWeeljack`. A hex base or a full scale that fails WCAG AA contrast applies and logs
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
      this.apply(primary ?? this.options.primary, this.surfaceState(), this.presetState());
    }
  }

  /**
   * Changes the surface (page, card and border) scale, in the forms of `WjThemeOptions.surface`,
   * including `{ light, dark }`. Omit it to return to the `provideWeeljack` surface. The primary
   * and the preset in effect are kept.
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
      this.apply(this.primaryState(), surface ?? this.options.surface, this.presetState());
    }
  }

  /**
   * Changes the base preset: pass `wjAura` from `weeljack-ng/preset-aura` or `wjNoir` from
   * `weeljack-ng/preset-noir`. Omit it to return to the `provideWeeljack` preset. The primary and
   * the surface in effect are kept.
   *
   * The result is what `provideWeeljack` would have produced with the three values, in light and
   * dark, and every mounted component re-themes at once. Only WeeljackNg presets are accepted, and
   * nothing is validated. Does nothing on the server.
   */
  setPreset(preset?: WjPreset): void {
    if (this.options === null || !this.browser) {
      return;
    }
    this.apply(this.primaryState(), this.surfaceState(), preset ?? this.options.preset);
  }

  /**
   * Returns the primary, the surface and the preset to what `provideWeeljack` set. Nothing is
   * validated: the bootstrap already reported its own values. Does nothing on the server.
   */
  reset(): void {
    if (this.options !== null && this.browser) {
      this.apply(this.options.primary, this.options.surface, this.options.preset);
    }
  }

  private apply(
    primary: WjColorScale | undefined,
    surface: WjThemeOptions['surface'],
    base: WjPreset | undefined,
  ): void {
    this.primaryState.set(primary);
    this.surfaceState.set(surface);
    this.presetState.set(base);
    const { brand, preset } = _wjThemePreset(primary, surface, base);
    // A component's token sheet is rewritten when it is mounted. Dropping the others makes the
    // page's variables equal a fresh bootstrap's, not only those of the components on screen.
    for (const sheet of this.document.head.querySelectorAll(
      'style[data-optimus-style-id$="-variables"]',
    )) {
      if (!COMMON_SHEETS.has(sheet.getAttribute('data-optimus-style-id') ?? '')) {
        sheet.remove();
      }
    }
    // Mounted components reload their sheets on `theme:change`, synchronously. A directive with no
    // style of its own (`pAnimateOnScroll`, under `wjAnimateOnScroll`) has no preset to read: it
    // writes `global-style` without the layer styles and marks `common` loaded. So the common
    // sheets are always written here, from the preset just set.
    usePreset(preset);
    Theme.deleteLoadedStyleName('common');
    this.optimus.loadCommonTheme();
    // A component's `-style` sheet is not rewritten by a switch, and one whose component unmounted
    // keeps the old preset's text: Optimus finds it by id and skips the write on the next mount.
    // Mounted components just re-registered their names, so a sheet whose name is not loaded is
    // stale. Dropping it makes the page equal a fresh bootstrap's. `global-style` is the common
    // sheet, written just above.
    const loaded: unknown = Theme.getLoadedStyleNames();
    if (loaded instanceof Set) {
      for (const sheet of this.document.head.querySelectorAll(
        'style[data-optimus-style-id$="-style"]',
      )) {
        const id = sheet.getAttribute('data-optimus-style-id') ?? '';
        if (id !== 'global-style' && !loaded.has(id.slice(0, -'-style'.length))) {
          sheet.remove();
        }
      }
    }
    runInInjectionContext(this.injector, () => {
      _wjWarnContrast('WjTheme', brand, this.options?.darkMode, true);
    });
  }
}
