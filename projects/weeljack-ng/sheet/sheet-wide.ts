import { isPlatformBrowser } from '@angular/common';
import {
  DOCUMENT,
  DestroyRef,
  InjectionToken,
  PLATFORM_ID,
  inject,
  signal,
  type Signal,
} from '@angular/core';

/** The width at which a `wj-sheet` is a dialog rather than a bottom drawer. */
const WIDE_QUERY = '(min-width: 768px)';

/**
 * Whether the app's layout is wide, which is what turns every `wj-sheet` into a dialog (`true`) or
 * a bottom drawer (`false`). It is one signal for the whole app: there is no per-sheet input and no
 * `provideWeeljack` option.
 *
 * The default follows `matchMedia('(min-width: 768px)')` live, and removes its listener when the
 * root injector is destroyed. It is `false` on the server, so the server renders drawer mode, and
 * `false` in a browser without a `matchMedia` function (a jsdom test).
 *
 * Point it at your own breakpoint once, in the application providers:
 *
 * ```ts
 * { provide: WJ_SHEET_WIDE, useFactory: () => inject(BreakpointService).wide }
 * ```
 *
 * and pin the mode in a spec:
 *
 * ```ts
 * { provide: WJ_SHEET_WIDE, useValue: signal(false) }
 * ```
 */
export const WJ_SHEET_WIDE = new InjectionToken<Signal<boolean>>('WJ_SHEET_WIDE', {
  providedIn: 'root',
  factory: () => {
    const view = inject(DOCUMENT).defaultView;
    if (!isPlatformBrowser(inject(PLATFORM_ID)) || !view || typeof view.matchMedia !== 'function') {
      return signal(false).asReadonly();
    }
    const query = view.matchMedia(WIDE_QUERY);
    const wide = signal(query.matches);
    const onChange = (event: MediaQueryListEvent): void => {
      wide.set(event.matches);
    };
    query.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => {
      query.removeEventListener('change', onChange);
    });
    return wide.asReadonly();
  },
});
