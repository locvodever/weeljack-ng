import { ElementRef, inject, type Signal } from '@angular/core';

/**
 * What is read of an Optimus control: its touched callback, which `BaseEditableHolder` types as
 * `Function` and which `registerOnTouched` replaces. Narrowed here, so no cast is needed.
 */
interface Touchable {
  readonly onModelTouched: unknown;
}

/**
 * Touched when focus leaves a control (w2-forms-choice FR-6). Optimus marks most controls touched
 * only on a pick, on focus or never, because its blur handler is bound nowhere in the template.
 * This returns the handler for the wrapper's host `(focusout)`: when the event's `relatedTarget`
 * lies outside the host, it calls the inner control's `onModelTouched`, the callback the form
 * registered through `_bridgeAccessor`. Focus that moves between parts inside the host marks
 * nothing, and a call before the inner control exists does nothing. Must run in an injection
 * context (a field initialiser), where it reads the host element:
 *
 * ```ts
 * @Component({ host: { '(focusout)': 'leave($event)' }, ... })
 * class WjThing {
 *   private readonly inner = viewChild(Thing);
 *   protected readonly leave = _touchedOnLeave(this.inner);
 * }
 * ```
 *
 * @docs-private
 */
export function _touchedOnLeave(inner: Signal<Touchable | undefined>): (event: FocusEvent) => void {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  return (event) => {
    const control = inner();
    if (control && !(event.relatedTarget instanceof Node && host.contains(event.relatedTarget))) {
      const touched = control.onModelTouched;
      if (typeof touched === 'function') {
        Reflect.apply(touched, control, []);
      }
    }
  };
}
