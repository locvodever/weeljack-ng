import { Directive, ElementRef, effect, inject, input } from '@angular/core';
import { KeyFilter } from '@openng/optimus-ui/keyfilter';
import { _checkWeeljackSetup } from 'weeljack-ng/private';
import type { WjKeyFilterPattern } from './keyfilter-types';

/**
 * Restricts which characters an `input` accepts, over Optimus's `pKeyFilter`. The `wjKeyFilter`
 * value is a `WjKeyFilterPattern` name (`pint`, `money`, `alpha`, …) or a `RegExp`, never
 * text that is evaluated. It works on a native `input`, and beside `wjInputText` or `wjInputMask`.
 *
 * A key whose character fails the pattern is blocked, and so is a paste with any failing
 * character (the whole pasted text, for a `RegExp` with a `{n}` quantifier). Navigation, Enter,
 * Tab and Escape always pass. The form sees only accepted characters through the element's own
 * accessor, so `ngModel`, `FormControl` and `[formField]` behave as without it. A blocked key
 * gives no feedback: say what is allowed in the label or hint.
 *
 * A `RegExp` is tested against the whole text with the new key appended, so anchor it:
 * `/^[a-z]*$/`, not `/[a-z]/`.
 *
 * It is not a form control: no value accessor, no `wj-field` registration, no ARIA input, no `pt`.
 */
@Directive({
  selector: 'input[wjKeyFilter]',
  // Optimus's pattern input is the member `pattern` under the alias `pKeyFilter`, which
  // `extract-api.mjs` cannot map to a member, so it is not exposed: the `wjKeyFilter` input below
  // forwards to it instead.
  hostDirectives: [KeyFilter],
  // A bound `[wjKeyFilter]` leaves no attribute in the DOM, and the harness (and a consumer's
  // CSS) finds the input by `input[wjKeyFilter]`. A static attribute in the template wins.
  host: { wjKeyFilter: '' },
})
export class WjKeyFilter {
  /**
   * The characters the input accepts: a pattern name or a `RegExp`. With none, every key passes.
   * Write a name as a static attribute, `wjKeyFilter="pint"`, and bind a `RegExp`.
   */
  readonly wjKeyFilter = input<RegExp | WjKeyFilterPattern | null | undefined>();

  constructor() {
    _checkWeeljackSetup('input[wjKeyFilter]');
    const filter = inject(KeyFilter);
    effect(() => {
      filter.pattern = this.wjKeyFilter();
    });
    // On Android Optimus restores the last valid text and emits `ngModelChange`, but dispatches
    // no `input` event, so the form would keep the rejected character. Dispatch it here.
    const element = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
    filter.ngModelChange.subscribe(() => {
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
}
