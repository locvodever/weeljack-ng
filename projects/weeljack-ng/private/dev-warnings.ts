import { ElementRef, InjectionToken, afterNextRender, inject } from '@angular/core';
import { Optimus } from '@openng/optimus-ui/config';

/** Where the errors pages live (20 Q6): `<docs>/errors/WJ<NNNN>`. */
const DOCS = 'https://locvodever.github.io/weeljack-ng';

/**
 * Provided by `provideWeeljack`. Its absence is how a `wj-*` component knows the provider is
 * missing.
 *
 * @docs-private
 */
export const _WJ_PROVIDED = new InjectionToken<true>('WJ_PROVIDED');

/** `provideWeeljack()` is missing from the application providers. */
const WJ0001 = 'WJ0001';
/** The Optimus theme lost the `wj` prefix after bootstrap: a second `provideOptimus` ran. */
const WJ0002 = 'WJ0002';

/** `aria-*` is written on a component host, where it is not forwarded to the focusable part. */
const WJ0003 = 'WJ0003';

/** One warning per code per application, however many components render. */
const warned = new WeakMap<object, Set<string>>();

function themePrefix(theme: unknown): string | undefined {
  if (typeof theme !== 'object' || theme === null || !('options' in theme)) {
    return undefined;
  }
  const options = theme.options;
  if (typeof options !== 'object' || options === null || !('prefix' in options)) {
    return undefined;
  }
  return typeof options.prefix === 'string' ? options.prefix : undefined;
}

function warn(optimus: Optimus, code: string, selector: string, what: string, fix: string): void {
  const seen = warned.get(optimus) ?? new Set<string>();
  warned.set(optimus, seen);
  if (seen.has(code)) {
    return;
  }
  seen.add(code);
  // 21 Q8: `WJ<NNNN>: <wj-selector>: <what is wrong>. <what to do>. Find more at <docs>/errors/WJ<NNNN>`.
  console.warn(`${code}: ${selector}: ${what}. ${fix}. Find more at ${DOCS}/errors/${code}`);
}

/**
 * Dev-mode warning (21 Q8) for a family's own `WJ<NNNN>` code: `console.warn`, never throws, once
 * per code per application, in the message shape `WJ<NNNN>: <wj-selector>: <what is wrong>. <what
 * to do>. Find more at <docs>/errors/WJ<NNNN>`. Must run in an injection context. A no-op in
 * production.
 *
 * @docs-private
 */
export function _warnOnce(code: string, selector: string, what: string, fix: string): void {
  if (!ngDevMode) {
    return;
  }
  warn(inject(Optimus), code, selector, what, fix);
}

/**
 * Dev-mode setup check (09 Q6) every `wj-*` component calls from its constructor: it warns
 * (`console.warn`, never throws) when `provideWeeljack` is missing, and when Optimus's theme has
 * lost the `wj` prefix after bootstrap. Must run in an injection context. A no-op in production.
 *
 * @docs-private
 */
export function _checkWeeljackSetup(selector: string): void {
  if (!ngDevMode) {
    return;
  }
  const optimus = inject(Optimus);
  if (inject(_WJ_PROVIDED, { optional: true }) === null) {
    warn(
      optimus,
      WJ0001,
      selector,
      'provideWeeljack() is missing from the application providers',
      'Add provideWeeljack() to your application config',
    );
    return;
  }
  // `theme` is an untyped Optimus signal: narrow it instead of trusting it.
  const theme: unknown = optimus.theme();
  if (themePrefix(theme) !== 'wj') {
    warn(
      optimus,
      WJ0002,
      selector,
      "the Optimus theme lost the 'wj' prefix after bootstrap because a second provideOptimus() ran",
      'Remove the provideOptimus() call and configure the theme through provideWeeljack() only',
    );
  }
}

/**
 * Dev-mode check (02 Q8) for a component whose focusable part sits inside Optimus: after the first
 * render it warns (`console.warn`, never throws) when `aria-*` is written on the `wj-*` host,
 * because host `aria-*` is not forwarded. Must run in an injection context. A no-op in production.
 * Attributes added after the first render are not seen.
 *
 * @docs-private
 */
export function _checkAriaOnHost(selector: string): void {
  if (!ngDevMode) {
    return;
  }
  const optimus = inject(Optimus);
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  afterNextRender(() => {
    const names = host.getAttributeNames().filter((name) => name.startsWith('aria-'));
    if (names.length > 0) {
      warn(
        optimus,
        WJ0003,
        selector,
        `${names.join(', ')} is set on the host, where it is not forwarded to the focusable element`,
        'Use the ariaLabel, ariaLabelledBy or ariaDescribedBy input instead',
      );
    }
  });
}
