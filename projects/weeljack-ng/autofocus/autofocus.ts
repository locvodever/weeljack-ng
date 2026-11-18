import { Directive, booleanAttribute, effect, inject, input } from '@angular/core';
import { AutoFocus } from '@openng/optimus-ui/autofocus';
import { _checkWeeljackSetup } from 'weeljack-ng/private';

/**
 * Moves focus into an element when it appears, over Optimus's `pAutoFocus`. It works on any
 * element: a native `input`, a `wjInputText` or `wjInputMask`, a container such as a `div`, or a
 * `wj-*` host such as `wj-inputnumber`. Focus goes to the first focusable descendant, or to the
 * element itself when it has none, once per element, in the browser only and just after the first
 * render.
 *
 * A bare `wjAutoFocus` turns it on; `wjAutoFocus="false"` or `[wjAutoFocus]="false"` turns it off.
 * Moving focus on load can disorient screen-reader and keyboard users: use it where the user
 * expects to type at once, such as the first field of a form you reveal, and never on content far
 * down a page.
 *
 * It is not a form control: no value accessor, no `wj-field` registration, no ARIA input, no `pt`.
 */
@Directive({
  selector: '[wjAutoFocus]',
  // Optimus's `pAutoFocus` input is the member `autofocus` under the alias `pAutoFocus`, which
  // `extract-api.mjs` cannot map to a member, and it has no boolean transform (a bare attribute
  // would pass `''`), so it is not exposed: the `wjAutoFocus` input below forwards to it.
  hostDirectives: [AutoFocus],
  // A bound `[wjAutoFocus]` leaves no attribute in the DOM, and the harness (and a consumer's
  // CSS) finds the element by `[wjAutoFocus]`. A static attribute in the template wins.
  host: { wjAutoFocus: '' },
})
export class WjAutoFocus {
  /**
   * Whether the element takes focus when it appears. A bare attribute is `true`; the string
   * `"false"` and `[wjAutoFocus]="false"` are `false`.
   */
  readonly wjAutoFocus = input(true, { transform: booleanAttribute });

  constructor() {
    _checkWeeljackSetup('[wjAutoFocus]');
    const autoFocus = inject(AutoFocus);
    // An effect in a constructor runs before the content hooks of the same pass, where Optimus
    // reads `autofocus` for the first time.
    effect(() => {
      autoFocus.autofocus = this.wjAutoFocus();
    });
  }
}
