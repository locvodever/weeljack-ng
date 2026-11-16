import { inject } from '@angular/core';
import { Optimus } from '@openng/optimus-ui/config';
import { _WJ_EN } from './translation-en';

/** A key of the `wj` own-strings group (w1-forms FR-13). */
export type _WjStringKey = keyof typeof _WJ_EN.wj;

/**
 * Reads WeeljackNg's own UI strings, the `wj` group of the translation `provideWeeljack` sets, as
 * a lookup. Each key falls back to the English default on its own, so a partial override keeps
 * every other string. Read once, when called: the language is not switched at runtime. Must run
 * in an injection context.
 *
 * @docs-private
 */
export function _wjStrings(): (key: _WjStringKey) => string {
  const group: unknown = inject(Optimus).getTranslation('wj');
  return (key) => {
    // `Object(...)` makes an absent group readable, and `typeof` keeps only a string an app set.
    const text: unknown = Reflect.get(Object(group), key);
    return typeof text === 'string' ? text : _WJ_EN.wj[key];
  };
}
