import { inject } from '@angular/core';
import { _warnOnce } from './dev-warnings';
import { _WJ_FIELD_CONTEXT } from './field-context';

/** A float or ifta label sits inside a `wj-field`: its control would get two labels. */
const WJ0100 = 'WJ0100';

/**
 * Dev-mode check (FR-5 of w2-forms-layout) that `wj-floatlabel` and `wj-iftalabel` call from their
 * constructors. A float or ifta label replaces `wj-field`'s label for its one control, so it warns
 * (`WJ0100`, `console.warn`, never throws, once per application) when it finds a `wj-field`
 * around it. Must run in an injection context. A no-op in production.
 *
 * @docs-private
 */
export function _checkNotInField(selector: string): void {
  if (!ngDevMode) {
    return;
  }
  if (inject(_WJ_FIELD_CONTEXT, { optional: true }) !== null) {
    _warnOnce(
      WJ0100,
      selector,
      'it sits inside a wj-field, so its control gets two labels',
      'Use the wj-field label or the in-field label, not both',
    );
  }
}
